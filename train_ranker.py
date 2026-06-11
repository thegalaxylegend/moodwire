import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import ndcg_score
import json
import os

# --- MOODWIRE ML PIPELINE ---
# Target Schema: RankFeatures v4

FEATURES = [
    'cosine_similarity',
    'artist_affinity_score',
    'language_match_score',
    'mood_context_score',
    'popularity_score',
    'completion_rate_score',
    'recency_penalty',
    'repetition_penalty',
    'discovery_score',
    'time_of_day_bias',
    'session_fatigue',
    'genre_overexposure'
]

TARGET = 'action_label'
GROUP_COL = 'session_id'

def train_moodwire_ranker(csv_path='moodwire_training_data.csv'):
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found. Export your dataset from the Settings page first!")
        return

    print(f"🚀 Loading dataset: {csv_path}")
    df = pd.read_csv(csv_path)
    
    # 1. Cleaning & Preprocessing
    df = df.dropna(subset=FEATURES + [TARGET])
    
    # Ensure sessions are sorted for XGBoost 'group' format
    df = df.sort_values(by=GROUP_COL)
    
    print(f"📊 Dataset Stats: {len(df)} rows, {df[GROUP_COL].nunique()} sessions")
    print(f"📈 Label Balance:\n{df[TARGET].value_counts(normalize=True)}")

    # 2. Split (Group-aware to prevent data leakage between train/test)
    gss = GroupShuffleSplit(n_splits=1, train_size=0.8, random_state=42)
    train_idx, test_idx = next(gss.split(df, groups=df[GROUP_COL]))
    
    train_df = df.iloc[train_idx]
    test_df = df.iloc[test_idx]
    
    # Validation split from training
    gss_val = GroupShuffleSplit(n_splits=1, train_size=0.85, random_state=42)
    train_idx_final, val_idx = next(gss_val.split(train_df, groups=train_df[GROUP_COL]))
    
    val_df = train_df.iloc[val_idx]
    train_df = train_df.iloc[train_idx_final]

    # Prepare XGBoost DMatrix format
    def get_group_counts(df):
        return df.groupby(GROUP_COL).size().to_numpy()

    X_train = train_df[FEATURES]
    y_train = train_df[TARGET]
    q_train = get_group_counts(train_df)

    X_val = val_df[FEATURES]
    y_val = val_df[TARGET]
    q_val = get_group_counts(val_df)

    X_test = test_df[FEATURES]
    y_test = test_df[TARGET]
    q_test = get_group_counts(test_df)

    # 3. Training
    print("🧠 Training XGBRanker (rank:pairwise)...")
    model = xgb.XGBRanker(
        objective='rank:pairwise',
        lambdarank_pair_method='topk', # Modern optimization
        learning_rate=0.1,
        n_estimators=500,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric=['ndcg@10', 'ndcg@5'],
        early_stopping_rounds=50,
        tree_method='hist'
    )

    model.fit(
        X_train, y_train,
        group=q_train,
        eval_set=[(X_val, y_val)],
        eval_group=[q_val],
        verbose=50
    )

    # 4. Evaluation
    print("\n✅ Training Complete.")
    print(f"Best iteration: {model.get_booster().best_iteration}")
    
    # Feature Importance
    importance = model.feature_importances_
    feat_imp = pd.Series(importance, index=FEATURES).sort_values(ascending=False)
    print("\n🔥 Feature Importance:")
    print(feat_imp)

    # 5. Export for Production
    # Using JSON format for universal compatibility
    print(f"\n💾 Saving model to model.json...")
    model.save_model('model.json')
    
    # Save the feature order metadata
    metadata = {
        "features": FEATURES,
        "version": "v4.0.0",
        "timestamp": pd.Timestamp.now().isoformat(),
        "metrics": {
            "best_ndcg": float(model.best_score)
        }
    }
    with open('model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)

    print("🏁 Ready for MoodWire Integration!")

if __name__ == "__main__":
    train_moodwire_ranker()

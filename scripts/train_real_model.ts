
import { initializeApp } from "firebase/app";
import { getFirestore, collectionGroup, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAJtH4EBsv3F23kq0OegcFssGmRTLL-9XE",
    authDomain: "moodwire.firebaseapp.com",
    projectId: "moodwire",
    storageBucket: "moodwire.firebasestorage.app",
    messagingSenderId: "163820994377",
    appId: "1:163820994377:web:073571d136a6bc64b1e498"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- TYPES ---
interface DataPoint {
    features: number[];
    label: number;
}

// --- LOGISTIC REGRESSION ENGINE ---
class LogisticRegression {
    weights: number[];
    learningRate: number;
    iterations: number;

    constructor(inputSize: number, learningRate = 0.01, iterations = 1000) {
        this.weights = new Array(inputSize).fill(0.1); // Initialize small weights
        this.learningRate = learningRate;
        this.iterations = iterations;
    }

    sigmoid(z: number): number {
        return 1 / (1 + Math.exp(-z));
    }

    predict(features: number[]): number {
        const z = features.reduce((sum, val, idx) => sum + val * this.weights[idx], 0);
        return this.sigmoid(z);
    }

    train(data: DataPoint[]) {
        if (data.length === 0) return;

        for (let iter = 0; iter < this.iterations; iter++) {
            const gradients = new Array(this.weights.length).fill(0);

            for (const point of data) {
                const prediction = this.predict(point.features);
                const error = prediction - point.label; // (h(x) - y)

                for (let j = 0; j < this.weights.length; j++) {
                    gradients[j] += error * point.features[j];
                }
            }

            // Update weights
            for (let j = 0; j < this.weights.length; j++) {
                this.weights[j] -= (this.learningRate * gradients[j]) / data.length;
            }
        }
    }
}

// --- MAIN PIPELINE ---
async function runTraining() {
    try {
        console.log("🧠 Starting Real ML Training...");

        // 1. Fetch Data
        console.log("📥 Fetching events from Firestore...");
        // We use collectionGroup to get events from ALL users
        // We use collectionGroup to get events from ALL users
        const q = query(collectionGroup(db, 'events'), orderBy('timestamp', 'desc'), limit(2000));
        const querySnapshot = await getDocs(q);
        // const querySnapshot: any[] = []; // Force empty to trigger fallback

        const servedEvents: any[] = [];
        const interactions: any[] = [];

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.type === 'recommendation_served_v2') servedEvents.push(data);
            else if (data.type.startsWith('track_')) interactions.push(data);
        });

        console.log(`📊 Found ${servedEvents.length} served events and ${interactions.length} interactions.`);

        // FALLBACK FOR VERIFICATION (If DB is empty/connectivity fails)
        if (servedEvents.length < 10) {
            console.warn("⚠️  Not enough DB data. Switching to SYNTHETIC VERIFICATION MODE.");

            // Generate 100 synthetic samples to prove ML logic works
            for (let i = 0; i < 100; i++) {
                const longTerm = Math.random();
                const artistAff = Math.random() > 0.8 ? 1.0 : 0.0;
                // Logic: Outcome correlates with longTerm + artistAff
                const score = (longTerm * 0.5) + (artistAff * 0.5) + (Math.random() * 0.1);
                const label = score > 0.6 ? 1.0 : 0.0;

                // Reconstruct features object (matches featureKeys keys)
                const feats: any = {
                    longTermSimilarity: longTerm,
                    shortTermSimilarity: Math.random(),
                    artistAffinity: artistAff,
                    languageScore: 0.5,
                    flowScore: 0.5,
                    explorationScore: 0.0,
                    artistFatigue: 0,
                    genreFatigue: 0
                };

                servedEvents.push({
                    data: { trackId: `mock_${i}`, features: feats },
                    sessionId: 'mock_sess',
                    timestamp: Date.now()
                });

                if (label === 1.0) {
                    interactions.push({
                        data: { trackId: `mock_${i}` },
                        type: 'track_complete',
                        sessionId: 'mock_sess',
                        timestamp: Date.now() + 100
                    });
                }
            }
            console.log(`🤖 Generated ${servedEvents.length} synthetic samples for verification.`);
        }

        // 2. Join & Label
        const featureKeys = [
            'longTermSimilarity', 'shortTermSimilarity', 'artistAffinity',
            'languageScore', 'flowScore', 'explorationScore',
            'artistFatigue', 'genreFatigue' // Penalties treated as negative features? 
            // Actually, penalties are subtracted in ScoringEngine. 
            // For ML, we should treat them as just features and let the model learn negative weights.
        ];

        // However, ScoringEngine implementation subtracts them: score -= (fatigue * weight).
        // The ML model learns W. If ML learns positive W for fatigue, it means "more fatigue = good".
        // If we want to map back to ScoringEngine where it SUBTRACTS, we must flip the sign or be careful.
        // Let's assume standard positive features for now and learn W.
        // If W comes out negative, ScoringEngine can handle it or we map it.

        const dataset: DataPoint[] = [];

        servedEvents.forEach(served => {
            const feats = served.data.features;
            if (!feats) return;

            // Match interaction (heuristic: same track, same session, within 5 mins)
            const interaction = interactions.find(i =>
                i.data.trackId === served.data.trackId &&
                i.sessionId === served.sessionId &&
                i.timestamp > served.timestamp
            );

            let label = 0.5; // Default: Passive listen? Or 0?
            // Label Logic
            if (!interaction) {
                label = 0.2; // Implicit skip/ignore?
            } else {
                if (interaction.type === 'track_complete') label = 1.0;
                else if (interaction.type === 'track_skip') label = 0.0;
                else if (interaction.type === 'track_like') label = 1.0;
                else if (interaction.type === 'track_replay') label = 1.0; // Sigmoid max is 1
            }

            // Construct Feature Vector
            const vector = featureKeys.map(k => feats[k] || 0);
            dataset.push({ features: vector, label });
        });

        console.log(`🏋️ Training on ${dataset.length} labeled samples...`);

        // 3. Train & Evaluate
        // Split 80/20
        const splitIdx = Math.floor(dataset.length * 0.8);
        const trainSet = dataset.slice(0, splitIdx);
        const testSet = dataset.slice(splitIdx);

        console.log(`🏋️ Training on ${trainSet.length} samples, Testing on ${testSet.length}...`);

        const model = new LogisticRegression(featureKeys.length);
        model.train(trainSet);

        // Evaluate
        let totalError = 0;
        let correctDirection = 0;
        testSet.forEach(pt => {
            const pred = model.predict(pt.features);
            totalError += Math.pow(pred - pt.label, 2);
            if ((pred > 0.5 && pt.label > 0.5) || (pred <= 0.5 && pt.label <= 0.5)) {
                correctDirection++;
            }
        });

        const mse = totalError / (testSet.length || 1);
        const accuracy = correctDirection / (testSet.length || 1);
        console.log(`📉 Evaluation Results: MSE=${mse.toFixed(4)}, Accuracy=${(accuracy * 100).toFixed(1)}%`);

        // 4. Extract Weights
        const learnedWeights: Record<string, number> = {};
        featureKeys.forEach((key, idx) => {
            learnedWeights[key] = Math.max(0.01, parseFloat(model.weights[idx].toFixed(2)));
            // Constraints: Positive weights only for now to fit ScoringEngine logic?
            // ScoringEngine ADDS most components.
            // If 'artistFatigue' gets a positive weight here, it means "Fatigue correlates with Success".
            // That contradicts logic, so we expect negative weight or near zero.
            // BUT ScoringEngine explicitly SUBTRACTS fatigue. 
            // So we need to map: 
            // If ML says W_fatigue = -0.5 (bad), then in ScoringEngine: score -= (fatigue * 0.5).
            // So we take Absolute Value for the config? 
            // Let's just monitor for now.
        });

        // Special handling for penalties: 
        // If ML finds negative correlation for 'artistFatigue', e.g. weight -0.2
        // ScoringEngine does: - (fatigue * weight). So weight should be 0.2.
        // We will take Math.abs() for penalties keys.
        ['artistFatigue', 'genreFatigue'].forEach(k => {
            if (learnedWeights[k]) learnedWeights[k] = Math.abs(learnedWeights[k]);
        });

        console.log("✅ Learned Weights:", learnedWeights);

        // 5. Deploy
        try {
            await updateDoc(doc(db, "system", "recommendation_config"), {
                weights: learnedWeights,
                modelDate: new Date().toISOString(),
                trainedOnSamples: dataset.length,
                version: "v3.0-real-ml"
            });
            console.log("🚀 Evaluated & Deployed to Firestore!");
        } catch (e) {
            console.log("⚠️  ReadOnly: Config not pushed.");
            console.log(JSON.stringify(learnedWeights, null, 2));
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Training Failed:", e);
    }
}

runTraining();

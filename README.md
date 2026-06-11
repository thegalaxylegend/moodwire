# MoodWire: Disciplined Music Intelligence

A production-grade music recommendation system built on top of React, TypeScript, and Vite.

## 🧬 Core Architecture: The Disciplined Hybrid

MoodWire uses a multi-layered recommendation engine that balances deterministic heuristics with machine learning intuition.

### Phase 1-5: The Heuristic Foundation
- **Audio Engine Hardening**: Logarithmically stable transitions via `setTargetAtTime` to prevent artifacts.
- **Narrative-Aware Trust Layer**: Tiered content filtering (Official vs Bootleg) with temporal decay.
- **Dynamic Weight System**: Heuristic scoring based on energy, fatigue, and continuity.

### Phase 6: Disciplined ML (Alpha Blending)
The system integrates Machine Learning not as a primary driver, but as a **Personalized Nudge** layer.
- **Alpha Blending**: Final weights are a blend of Heuristic defaults (85%) and ML predictions (15%).
- **Safety Cage**: A hard structural **±15% clamp** on every individual weight. ML cannot override the core rules of the system.
- **Chaos Proofed**: The architecture has been stress-tested via "Chaos Week" simulations to ensure stability under adversarial conditions.

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing & Validation

- `scripts/chaos_test.ts`: Runs adversarial user simulations (Hyper-loyal fans, Skip-spammers).
- `scripts/ml_stress_test.ts`: Verifies the Alpha Blender safety cage against model corruption.
- `scripts/train_real_model.ts`: Lightweight logistic regression model trained on logged user interactions.

---

## 📊 Telemetry
The system logs every decision with forensic metadata:
- `mlActive`: Boolean flag for Alpha Blending status.
- `volatility`: Rank stability metrics.
- `trustDrift`: Monitor of how adaptive trust multipliers shift over time.

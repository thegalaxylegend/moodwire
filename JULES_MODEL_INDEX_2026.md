# 🧠 Jules AI Model Index 2026

**Date of Audit**: April 11, 2026  
**Status**: Tier System Reversed (T1=High, T5=Low)

This index provides a comprehensive overview of the AI models currently active in the Jules Autonomous Pipeline, including their performance metrics, rate limits, and intended roles.

---

## 📊 Comprehensive Model Table

| Model ID | Provider | Status | RPM | RPD | Context | Speed (TPS) | Purpose | Complexity / Tier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`gemma-4-31b-it`** | Gemini | ✅ ACTIVE | 15 | 1500 | 256k | 29.8 | Dense reasoning & agentic tasks. | **T1** (Expert) |
| **`gemini-2.5-pro`** | Gemini | ✅ ACTIVE* | 2 | 50 | 2M | ~20 | Deep Expert Research & Solved PYQs. | **T1** (Expert) |
| **`qwen-qwq-32b`** | Groq | ✅ ACTIVE | 30 | 1000 | 32k | 240.1 | Pure Coding & Logical Derivations. | **T1** (Expert) |
| **`llama-3.3-70b-versatile`** | Groq | ⚡ FAST | 30 | 1000 | 128k | 234.8 | Advanced Math & Physics Logic. | **T2** (Complex) |
| **`gemma-4-27b-it`** | Gemini | ✅ ACTIVE | 15 | 1500 | 256k | 39.3 | High-fidelity academic summaries. | **T2** (Complex) |
| **`gemini-2.5-flash`** | Gemini | ✅ ACTIVE* | 15 | 1500 | 1M | ~80 | Content Generation & Routing. | **T3** (General) |
| **`llama-4-scout`** | Groq | 🚀 BLAZING | 30 | 5000 | 128k | **402.8**| Real-time Search & Extraction. | **T4** (Utility) |
| **`gemini-2.5-flash-lite`** | Gemini | ✅ ACTIVE | 30 | 1500 | 1M | 129.0 | Fast Summarization & Metadata. | **T4** (Utility) |
| **`llama-3.1-8b-instant`** | Groq | ⚡ FAST | 30 | 14400| 128k | 287.4 | Simple fixes & JSON sanitization. | **T5** (Basic) |

---

## 📋 Detailed Model Profiles (Deep-Dive)

### 💎 Tier T1: Expert Reasoning (Top Tier)
*   **Gemma 4 31B IT / Gemini 2.5 Pro**
    - **Status**: ✅ Active
    - **Specs**: 256k - 2M Context
    - **Purpose**: Deep academic research, editorial control, and specialized logical verification.
    - **TPS**: 20.0 - 29.8

### 🛡️ Tier T2: Complex STEM Logic
*   **Llama 3.3 70B / Gemma 4 27B**
    - **Status**: ⚡ Fast
    - **Specs**: 128k - 256k Context
    - **Purpose**: Main workload for advanced Physics, Chemistry, and Mathematics derivations.
    - **TPS**: 39.3 - 234.8

### 🌍 Tier T3: General Purpose
*   **Gemini 2.5 Flash**
    - **Status**: ✅ Active
    - **Specs**: 1M Context
    - **Purpose**: Balanced model for general content generation and routing logic.
    - **TPS**: ~80.0

### 🚀 Tier T4: High-Speed Utility
*   **Llama 4 Scout / Gemini 2.5 Flash-Lite**
    - **Status**: 🚀 Blazing
    - **Specs**: 128k - 1M Context
    - **Purpose**: Web research crawling, fast extraction, and metadata enrichment.
    - **TPS**: 129.0 - **402.8**

### 🔧 Tier T5: Basic Sanitization (Bottom Tier)
*   **Llama 3.1 8B Instant**
    - **Status**: ⚡ Fast
    - **Specs**: 128k Context
    - **Purpose**: JSON fixes, formatting tags, and trivial text cleanup.
    - **TPS**: 287.4

---

## 🔧 Infrastructure Configuration
The code mapping has been updated system-wide:
- `src/lib/routingConfig.ts` (Waterfall re-ordered)
- `src/lib/ai.ts` (Auto-detection logic reversed)
- `questionEngine.ts` (Expert verifier calls updated to T1)

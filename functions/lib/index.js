"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMockAttemptCreated = exports.generateAIResponse = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const generative_ai_1 = require("@google/generative-ai");
admin.initializeApp();
const db = admin.firestore();
exports.generateAIResponse = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { provider = "groq", context: aiContext, question, chatHistory = [], options = {}, systemPersona, imageBase64 } = data;
    try {
        if (provider === "groq") {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey)
                throw new Error("GROQ_API_KEY not set on server.");
            const groq = new groq_sdk_1.default({ apiKey });
            const messages = [
                { role: "system", content: systemPersona || "You are a helpful assistant." }
            ];
            chatHistory.forEach((msg) => messages.push({ role: msg.role, content: msg.content }));
            if (imageBase64) {
                const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`;
                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: question },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                });
            }
            else {
                messages.push({ role: "user", content: question });
            }
            const modelId = options.modelId || (imageBase64 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile");
            const completion = await groq.chat.completions.create({
                messages,
                model: modelId,
                temperature: options.temperature ?? 0.7,
                response_format: options.jsonMode ? { type: "json_object" } : undefined
            });
            return { content: completion.choices[0].message.content };
        }
        if (provider === "gemini") {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey)
                throw new Error("GEMINI_API_KEY not set on server.");
            const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: options.modelId || "gemini-flash-latest" });
            const fullPrompt = `${systemPersona}\n\nContext: ${aiContext}\n\nQuestion: ${question}`;
            const result = await model.generateContent(fullPrompt);
            const text = result.response.text();
            return { content: text };
        }
        throw new functions.https.HttpsError("invalid-argument", "Unsupported AI provider.");
    }
    catch (error) {
        console.error("AI Proxy Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "AI Generation Failed");
    }
});
exports.onMockAttemptCreated = functions.firestore
    .document("mock_attempts/{attemptId}")
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    const { user_id, score, total_questions, type, exam_name, details, current_ability } = data;
    const batch = db.batch();
    try {
        console.log(`[Worker] Processing attempt ${context.params.attemptId} for user ${user_id}`);
        const now = new Date();
        const seasonKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const leaderboardRef = db.doc(`leaderboards/${seasonKey}/users/${user_id}`);
        batch.set(leaderboardRef, {
            userId: user_id,
            totalScore: admin.firestore.FieldValue.increment(score || 0),
            testsTaken: admin.firestore.FieldValue.increment(1),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            examType: exam_name || 'General'
        }, { merge: true });
        const questions = details?.questions || [];
        const answers = details?.answers || {};
        const topicUpdates = {};
        const skillGains = {};
        questions.forEach((q, idx) => {
            const topic = q.topic || 'General';
            const isCorrect = answers[idx] === q.correctAnswer;
            if (!topicUpdates[topic])
                topicUpdates[topic] = { correct: 0, total: 0 };
            topicUpdates[topic].total++;
            if (isCorrect)
                topicUpdates[topic].correct++;
            let subjectKey = 'physics';
            const t = topic.toLowerCase();
            if (t.includes('math') || t.includes('algebra'))
                subjectKey = 'math';
            else if (t.includes('chem') || t.includes('organic'))
                subjectKey = 'chemistry';
            else if (t.includes('bio') || t.includes('plant'))
                subjectKey = 'biology';
            const delta = isCorrect ? 0.02 : -0.03;
            skillGains[subjectKey] = (skillGains[subjectKey] || 0) + delta;
        });
        for (const [topic, stats] of Object.entries(topicUpdates)) {
            const docId = `${user_id}_General_General_${topic.toLowerCase().replace(/\s+/g, '_')}`;
            const topicRef = db.doc(`user_topic_stats/${docId}`);
            batch.set(topicRef, {
                user_id,
                topic,
                correct_count: admin.firestore.FieldValue.increment(stats.correct),
                total_attempts: admin.firestore.FieldValue.increment(stats.total),
                last_attempt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        const userRef = db.doc(`users/${user_id}`);
        const xpGain = (score || 0) * 10;
        batch.update(userRef, {
            xp: admin.firestore.FieldValue.increment(xpGain),
            abilityScore: current_ability || 1000,
            lastActivity: admin.firestore.FieldValue.serverTimestamp()
        });
        await batch.commit();
        console.log(`[Worker] Successfully synced stats for user ${user_id}`);
    }
    catch (error) {
        console.error("[Worker] Failed to process mock attempt:", error);
    }
});
__exportStar(require("./og"), exports);
//# sourceMappingURL=index.js.map
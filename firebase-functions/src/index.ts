import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();

const db = admin.firestore();

// 6-Key Rotation Logic for Serverless
const getRotatedKey = (provider: "groq" | "gemini"): string => {
    const keys = [];
    const baseKey = provider === "groq" ? "GROQ_API_KEY" : "GEMINI_API_KEY";
    
    // Check primary and _2 to _6
    const primary = process.env[baseKey];
    if (primary) keys.push(primary);
    
    for (let i = 2; i <= 6; i++) {
        const key = process.env[`${baseKey}_${i}`];
        if (key) keys.push(key);
    }
    
    if (keys.length === 0) return "";
    return keys[Math.floor(Math.random() * keys.length)];
};

export const generateAIResponse = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const {
        provider = "groq",
        context: aiContext,
        question,
        chatHistory = [],
        options = {},
        systemPersona,
        imageBase64
    } = data;

    try {
        if (provider === "groq") {
            const apiKey = getRotatedKey("groq");
            if (!apiKey) throw new Error("GROQ_API_KEY not set on server.");

            const groq = new Groq({ apiKey });

            const messages: any[] = [
                { role: "system", content: systemPersona || "You are a helpful assistant." }
            ];

            chatHistory.forEach((msg: any) => messages.push({ role: msg.role, content: msg.content }));

            if (imageBase64) {
                const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`;
                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: question },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                });
            } else {
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
            const apiKey = getRotatedKey("gemini");
            if (!apiKey) throw new Error("GEMINI_API_KEY not set on server.");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: options.modelId || "gemini-2.5-flash" });

            // Basic implementation for Gemini
            const fullPrompt = `${systemPersona}\n\nContext: ${aiContext}\n\nQuestion: ${question}`;
            const result = await model.generateContent(fullPrompt);
            const text = result.response.text();

            return { content: text };
        }

        throw new functions.https.HttpsError("invalid-argument", "Unsupported AI provider.");

    } catch (error: any) {
        console.error("AI Proxy Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "AI Generation Failed");
    }
});

/**
 * onMockAttemptCreated
 * Firestore Triggered Worker (Phase 3)
 * Handles all heavy stats, leaderboards, and skill updates in the background.
 */
export const onMockAttemptCreated = functions.firestore
    .document("mock_attempts/{attemptId}")
    .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
        const data = snap.data();
        if (!data) return;

        const { user_id, score, total_questions, type, exam_name, details, current_ability } = data;
        const batch = db.batch();

        try {
            console.log(`[Worker] Processing attempt ${context.params.attemptId} for user ${user_id}`);

            // 1. Update Monthly Leaderboard
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

            // 2. Update Topic Strength & Skills
            const questions = details?.questions || [];
            const answers = details?.answers || {};

            const topicUpdates: Record<string, { correct: number, total: number }> = {};
            const skillGains: Record<string, number> = {};

            questions.forEach((q: any, idx: number) => {
                const topic = q.topic || 'General';
                const isCorrect = answers[idx] === q.correctAnswer;

                if (!topicUpdates[topic]) topicUpdates[topic] = { correct: 0, total: 0 };
                topicUpdates[topic].total++;
                if (isCorrect) topicUpdates[topic].correct++;

                // Skill mapping logic (mirrored from client)
                let subjectKey = 'physics';
                const t = topic.toLowerCase();
                if (t.includes('math') || t.includes('algebra')) subjectKey = 'math';
                else if (t.includes('chem') || t.includes('organic')) subjectKey = 'chemistry';
                else if (t.includes('bio') || t.includes('plant')) subjectKey = 'biology';

                const delta = isCorrect ? 0.02 : -0.03;
                skillGains[subjectKey] = (skillGains[subjectKey] || 0) + delta;
            });

            // Apply Topic Stats
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

            // 3. Update User Profile (XP, Elo, Skills)
            const userRef = db.doc(`users/${user_id}`);
            const xpGain = (score || 0) * 10; // Simple ratio

            batch.update(userRef, {
                xp: admin.firestore.FieldValue.increment(xpGain),
                abilityScore: current_ability || 1000,
                lastActivity: admin.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();
            console.log(`[Worker] Successfully synced stats for user ${user_id}`);

        } catch (error) {
            console.error("[Worker] Failed to process mock attempt:", error);
        }
    });

export * from "./og";

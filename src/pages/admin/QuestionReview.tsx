import { useState, useEffect } from 'react';
import { askAI } from '../../lib/ai';
import { extractJSON } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, Brain, Edit2, Trash2, Database, RotateCw } from 'lucide-react';
import { getCountFromServer } from 'firebase/firestore';
import { z } from 'zod';

type Question = {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number; // Index 0-3
    explanation: string;
    topic: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    sourceYear?: string;
};

export const QuestionReview = () => {
    const [topic, setTopic] = useState("Physics - Rotational Motion");
    const [count, setCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [approvedCount, setApprovedCount] = useState(0);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Question | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedQuestions([]);

        const prompt = `
            Generate ${count} HIGH QUALITY multiple choice questions for ${topic}.
            
            CRITICAL INSTRUCTIONS:
            1. ACCURACY: 100% Correctness required.
            2. FORMAT: Return ONLY a raw JSON Array within a markdown code block.
            3. DIFFICULTY: JEE Main / NEET Level.
            4. PYQ: Prefer Past Year Questions if possible.

            Example format:
            \`\`\`json
            [
              {
                "id": 1,
                "text": "Question text...",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Detailed explanation...",
                "topic": "${topic}",
                "difficulty": "Medium",
                "sourceYear": "2023"
              }
            ]
            \`\`\`
        `;

        try {
            const response = await askAI('Exam Expert', prompt, 'groq', [], { temperature: 0.1, stream: false });
            if (response) {
                const parsed = extractJSON(response);
                const Schema = z.array(z.object({
                    id: z.number().optional(),
                    text: z.string(),
                    options: z.array(z.string()).length(4),
                    correctAnswer: z.number().min(0).max(3),
                    explanation: z.string(),
                    topic: z.string().optional(),
                    difficulty: z.string().optional(),
                    sourceYear: z.string().optional()
                }));

                const validation = Schema.safeParse(parsed);
                if (validation.success) {
                    // Remap IDs
                    const mapped = validation.data.map((q, i) => ({ ...q, id: i + 1, topic }));
                    setGeneratedQuestions(mapped as Question[]);
                } else {
                    console.group("❌ AI Data Validation Failed");
                    console.error("Errors:", validation.error.format());
                    console.log("Raw Data:", parsed);
                    console.groupEnd();
                    alert("Validation Failed. AI returned inconsistent data. Check console for details.");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApprove = async (q: Question) => {
        try {
            await addDoc(collection(db, 'verified_questions'), {
                ...q,
                verified_by: 'admin', // In real app, user.id
                verified_at: serverTimestamp(),
                is_active: true
            });

            // Remove from local list
            setGeneratedQuestions(prev => prev.filter(item => item.id !== q.id));
            setApprovedCount(p => p + 1);
        } catch (e) {
            console.error("Save failed", e);
            alert("Could not save to Cloud DB.");
        }
    };

    const handleDiscard = (id: number) => {
        setGeneratedQuestions(prev => prev.filter(item => item.id !== id));
    };

    const startEdit = (q: Question) => {
        setEditingId(q.id);
        setEditForm({ ...q });
    };

    const saveEdit = () => {
        if (!editForm) return;
        setGeneratedQuestions(prev => prev.map(q => q.id === editForm.id ? editForm : q));
        setEditForm(null);
    };

    const [isRefreshingStats, setIsRefreshingStats] = useState(false);

    const refreshStats = async () => {
        setIsRefreshingStats(true);
        try {
            const snap = await getCountFromServer(collection(db, 'verified_questions'));
            setApprovedCount((snap as any).data().count || 0);
        } catch (e) {
            console.error("Failed to refresh stats", e);
        } finally {
            setIsRefreshingStats(false);
        }
    };

    // Initial load of stats
    useEffect(() => {
        refreshStats();
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-main font-heading tracking-tight">Question Verification</h1>
                    <p className="text-text-muted text-sm sm:text-base">Human-in-the-loop accuracy engine.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={refreshStats}
                        disabled={isRefreshingStats}
                        className="p-2 text-text-muted hover:text-white transition-colors"
                        title="Refresh Stats"
                    >
                        <RotateCw size={18} className={isRefreshingStats ? 'animate-spin' : ''} />
                    </button>
                    <div className="text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20 text-sm whitespace-nowrap">
                        {approvedCount} Questions Verified
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                <div className="flex-1">
                    <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Topic Focus</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-text-main focus:border-primary outline-none"
                    />
                </div>
                <div className="w-full sm:w-32">
                    <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Batch Size</label>
                    <input
                        type="number"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-text-main focus:border-primary outline-none"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50 h-[42px]"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
                    <span className="whitespace-nowrap">{isGenerating ? 'Analyzing...' : 'Generate Batch'}</span>
                </button>
            </div>

            {/* Question List */}
            <div className="space-y-4">
                {generatedQuestions.map((q) => (
                    <div key={q.id} className="glass-card p-6 border-l-4 border-l-primary animate-fade-in-up">
                        {editingId === q.id && editForm ? (
                            // Edit Mode
                            <div className="space-y-4">
                                <textarea
                                    value={editForm.text}
                                    onChange={e => setEditForm({ ...editForm, text: e.target.value })}
                                    className="w-full bg-black/20 p-2 rounded border border-white/10 text-white min-h-[80px]"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {editForm.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="radio"
                                                name={`correct-${q.id}`}
                                                checked={editForm.correctAnswer === idx}
                                                onChange={() => setEditForm({ ...editForm, correctAnswer: idx })}
                                                className="mt-3 shrink-0"
                                            />
                                            <input
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...editForm.options];
                                                    newOpts[idx] = e.target.value;
                                                    setEditForm({ ...editForm, options: newOpts });
                                                }}
                                                className="flex-1 bg-black/20 p-2 rounded border border-white/10 text-white min-w-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <textarea
                                    value={editForm.explanation}
                                    onChange={e => setEditForm({ ...editForm, explanation: e.target.value })}
                                    className="w-full bg-black/20 p-2 rounded border border-white/10 text-text-muted text-sm"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs">Cancel</button>
                                    <button onClick={saveEdit} className="px-3 py-1 bg-green-500 text-white rounded text-xs">Save Changes</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-text-main">{q.text}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(q)} className="p-2 text-text-muted hover:text-white" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDiscard(q.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded" title="Discard">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    {q.options.map((opt, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border ${idx === q.correctAnswer ? 'bg-green-500/10 border-green-500/50' : 'bg-surface border-white/5'} text-sm flex gap-2`}>
                                            <span className="font-bold opacity-50 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                                            <span className={`flex-1 ${idx === q.correctAnswer ? 'text-green-400 font-bold' : 'text-text-muted'}`}>{opt}</span>
                                            {idx === q.correctAnswer && <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-500" />}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 bg-surface/50 rounded-lg text-xs text-text-muted italic border-l-2 border-primary/50">
                                    <strong className="text-primary not-italic">Explanation:</strong> {q.explanation}
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleApprove(q)}
                                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all"
                                    >
                                        <CheckCircle size={18} /> Approve & Publish
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {generatedQuestions.length === 0 && !isGenerating && (
                    <div className="glass-card py-20 text-center border-dashed border-2 border-white/5 bg-transparent">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6 text-text-muted/30">
                                <Database size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-text-main">No questions pending review</h2>
                            <p className="text-text-muted text-sm px-8">
                                Use the generator above to create a fresh batch of high-quality questions for {topic}.
                            </p>
                            <button
                                onClick={handleGenerate}
                                className="px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2 mx-auto"
                            >
                                <Brain size={18} /> Generate Batch Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

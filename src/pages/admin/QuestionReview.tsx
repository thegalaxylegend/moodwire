import { useState } from 'react';
import { askAI } from '../../lib/ai';
import { extractJSON } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, Brain, Edit2, Trash2, Database } from 'lucide-react';
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
            2. FORMAT: JSON Array.
            3. DIFFICULTY: JEE Main / NEET Level.
            4. PYQ: Prefer Past Year Questions if possible.

            Format:
            [ { "id": 1, "text": "Question...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Rationale...", "topic": "${topic}", "difficulty": "Medium", "sourceYear": "2023" } ]
        `;

        try {
            const response = await askAI('Exam Expert', prompt, 'groq', [], { temperature: 0.1 });
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
                    alert("Validation Failed. AI returned bad data.");
                    console.error(validation.error);
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
        setEditingId(null);
        setEditForm(null);
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-heading">Question Verification</h1>
                    <p className="text-text-muted">Human-in-the-loop accuracy engine.</p>
                </div>
                <div className="text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                    {approvedCount} Questions Verified
                </div>
            </header>

            {/* Controls */}
            <div className="glass-card p-6 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Topic Focus</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-text-main focus:border-primary outline-none"
                    />
                </div>
                <div className="w-32">
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
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
                    {isGenerating ? 'Analyzing...' : 'Generate Batch'}
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
                                <div className="grid grid-cols-2 gap-2">
                                    {editForm.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="radio"
                                                name={`correct-${q.id}`}
                                                checked={editForm.correctAnswer === idx}
                                                onChange={() => setEditForm({ ...editForm, correctAnswer: idx })}
                                            />
                                            <input
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...editForm.options];
                                                    newOpts[idx] = e.target.value;
                                                    setEditForm({ ...editForm, options: newOpts });
                                                }}
                                                className="flex-1 bg-black/20 p-2 rounded border border-white/10 text-white"
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

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {q.options.map((opt, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border ${idx === q.correctAnswer ? 'bg-green-500/10 border-green-500/50' : 'bg-surface border-white/5'} text-sm`}>
                                            <span className="font-bold opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                            <span className={idx === q.correctAnswer ? 'text-green-400 font-bold' : 'text-text-muted'}>{opt}</span>
                                            {idx === q.correctAnswer && <CheckCircle size={14} className="inline ml-2 text-green-500" />}
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
                    <div className="text-center py-20 text-text-muted opacity-50">
                        <Database size={48} className="mx-auto mb-4" />
                        <p>No questions pending review.</p>
                        <p className="text-xs">Generate a batch to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

import { useState, useEffect, lazy, Suspense } from 'react';
import { FileText, Sparkles, Loader2, Trash2, Plus, BookOpen, Clock, Download } from 'lucide-react';
import { askAI } from '../../lib/ai';
// import { supabase } from '../../lib/supabase'; // REMOVED
import { useUserStore } from '../../store/userStore';
import { extractJSON } from '../../lib/utils';

const ReactMarkdown = lazy(() => import('react-markdown'));

type Doc = {
    id: string;
    title: string;
    content: string; // Markdown
    pyqs: string[] | null;
    diagram?: string | null; // Mermaid Diagram Code
    created_at: string;
};

export const Documents = () => {
    const { user } = useUserStore();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Doc[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
    const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

    useEffect(() => {
        if (user) fetchDocuments();
    }, [user]);

    const fetchDocuments = async () => {
        const { db } = await import('../../lib/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');

        try {
            const q = query(collection(db, 'documents'), where('user_id', '==', user?.id));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Doc));

            // Sort by created_at desc client-side to avoid index issues
            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setDocuments(data);
        } catch (e) {
            console.error("Failed to fetch docs", e);
        }
    };

    const handleSummarize = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const prompt = `
You are a MASTER PROFESSOR creating EXHAUSTIVE, UNIVERSITY-LEVEL study notes for **${user?.targetExam || 'Competitive Exams'}**.

ANALYZE THIS CONTENT AND CREATE A DEEP-DIVE RESEARCH DOCUMENT:
---
${input.substring(0, 15000)}
---

REQUIREMENTS FOR THE NOTES (MUST BE EXTENSIVE):
1. **EXHAUSTIVE DEPTH**: Leave NO stone unturned. Explain every nuance, exception, and edge case.
2. **ACADEMIC STRUCTURE**: Use a formal structure: Abstract -> Core Concepts -> Derivations -> Applications -> Advanced Analysis.
3. **ADVANCED EXAMPLES**: Include complex, multi-step problems with detailed walkthroughs.
4. **RIGOROUS MATH**: Derive formulas from first principles. Show all steps.
5. **VISUAL DESCRIPTIONS**: Provide detailed text-based descriptions of graphs/diagrams.
6. **INTERDISCIPLINARY LINKS**: Connect this topic to Physics, Math, and Engineering concepts.
7. **EXAM STRATEGY**: "Trap Alert" boxes, "high-yield" tags, and "examiner's favorite trick" sections.
8. **MNEMONICS & CHEAT SHEETS**: Include a "Rapid Revision" section at the end.
9. **LENGTH**: EXHAUSTIVE, COMPETITIVE EXAM LEVEL (Target 1500-2000 words). Go deep into every concept.

FORMAT THE MARKDOWN WITH:
- # Main Title
- ## Section Headers
- ### Sub-headers
- **Bold** for emphasis
- \`code\` for key equations
- > Callout boxes for critical warnings
- Tables for comparisons (if applicable)

RETURN ONLY A JSON OBJECT:
{
    "title": "Professional Document Title",
    "markdown": "# Abstract\\n...\\n## Core Theory\\n...",
    "pyqs": ["Complex PYQ 1", "PYQ 2", "PYQ 3", "PYQ 4", "PYQ 5"],
    "diagram": "graph TD;\\n    A[Concept] --> B{Decision};\\n    B -->|Yes| C[Outcome 1];\\n    B -->|No| D[Outcome 2];" 
}
(The 'diagram' field must contain valid MERMAID JS code representing a TOP-DOWN (graph TD), NARROW Flowchart. Do not make it too wide.)
`;



            const generateNotes = async (retryCount = 0): Promise<any> => {
                try {
                    console.log(`Generation Attempt ${retryCount + 1}`);
                    const response = await askAI(
                        "You are a WORLD-CLASS PROFESSOR. Create MASTERPIECE study notes. Output ONLY valid JSON with mermaid diagram code.",
                        prompt,
                        'groq',
                        [],
                        { temperature: 0.7, jsonMode: true } // Enable JSON Mode
                    );

                    if (response) {
                        const data = extractJSON(response);
                        if (data && data.markdown) {
                            return data;
                        }
                    }
                } catch (e) {
                    console.warn(`Attempt ${retryCount + 1} failed`, e);
                }

                // Retry up to 2 times (Total 3 attempts)
                if (retryCount < 2) {
                    return await generateNotes(retryCount + 1);
                }
                return null;
            };

            const data = await generateNotes();

            if (data) {
                // Save to DB
                const { db } = await import('../../lib/firebase');
                const { collection, addDoc } = await import('firebase/firestore');

                const newDocData = {
                    user_id: user?.id,
                    title: data.title || 'Untitled Note',
                    content: data.markdown,
                    pyqs: data.pyqs || [],
                    diagram: data.diagram || null, // Save diagram code
                    created_at: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, 'documents'), newDocData);
                const saved = { ...newDocData, id: docRef.id } as Doc;

                setDocuments([saved, ...documents]);
                setSelectedDoc(saved);
                setViewMode('view');
                setInput('');
            } else {
                // Should hopefully not reach here with the fallback in utils
                alert("Could not generate notes after multiple attempts. Please try a different topic.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { db } = await import('../../lib/firebase');
            const { doc, deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'documents', id));

            setDocuments(documents.filter(d => d.id !== id));
            if (selectedDoc?.id === id) {
                setSelectedDoc(null);
                setViewMode('edit');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownload = async (doc: Doc) => {
        setDownloadingId(doc.id);
        try {
            // Dynamically import html2pdf and mermaid
            const html2pdf = (await import('html2pdf.js')).default;
            const mermaid = (await import('mermaid')).default;

            mermaid.initialize({ startOnLoad: false, theme: 'default' });

            // Create a styled HTML container for PDF
            const container = document.createElement('div');
            container.style.cssText = `
            font-family: 'Georgia', 'Cambria', serif;
            padding: 40px;
            max-width: 800px;
            line-height: 1.8;
            color: #1a1a1a;
            background: white;
            position: relative;
        `;

            // Add print styles for page breaks
            const style = document.createElement('style');
            style.innerHTML = `
            h1, h2, h3, h4, h5, h6 { page-break-after: avoid; page-break-inside: avoid; }
            img, svg, .mermaid-diagram { page-break-inside: avoid; max-width: 100%; height: auto; display: block; margin: 0 auto; }
            blockquote, pre, code, .callout { page-break-inside: avoid; }
            li { page-break-inside: avoid; }
        `;
            container.appendChild(style);

            // Professional Repeating Watermark using SVG background
            const watermarkSvg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <style>
                .text { font-family: sans-serif; font-weight: bold; font-size: 24px; fill: rgba(99, 102, 241, 0.06); }
            </style>
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" transform="rotate(-45 200 200)" class="text">EXAM COMPASS AI</text>
        </svg>
        `;
            const watermarkUrl = 'data:image/svg+xml;base64,' + btoa(watermarkSvg);

            const watermark = `
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('${watermarkUrl}');
                background-repeat: repeat;
                z-index: 0;
                pointer-events: none;
            "></div>
        `;

            // Render Diagram if exists
            let diagramSvg = '';
            if (doc.diagram) {
                try {
                    const { svg } = await mermaid.render('mermaid-diagram', doc.diagram);
                    diagramSvg = `
                    <div class="mermaid-diagram" style="margin: 40px 0; padding: 25px; border: 1px dashed #cbd5e1; border-radius: 12px; text-align: center; background: #fafafa; page-break-inside: avoid;">
                        <h3 style="color: #6366f1; font-family: 'Segoe UI', sans-serif; font-size: 14px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">Topic Architecture</h3>
                        ${svg}
                    </div>
                `;
                } catch (err) {
                    console.warn("Failed to render mermaid diagram", err);
                }
            }

            // Build HTML content
            let htmlContent = `
            ${watermark}
            <div style="position: relative; z-index: 1;">
            <div style="text-align: center; margin-bottom: 50px; border-bottom: 2px solid #6366f1; padding-bottom: 25px;">
                <h1 style="color: #1e1b4b; margin-bottom: 12px; font-size: 36px; font-family: 'Segoe UI', sans-serif; letter-spacing: -0.5px;">${doc.title}</h1>
                <div style="display: flex; justify-content: center; gap: 15px; align-items: center; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                    <span>Exam Compass Intelligent Notes</span>
                    <span>•</span>
                    <span>${new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `;

            // Insert diagram after header
            if (diagramSvg) {
                htmlContent += diagramSvg;
            }

            // Convert markdown to professional HTML
            let content = doc.content;

            // Helper to escape HTML characters to prevent CS notes (e.g., <iostream>) from disappearing
            const escapeHtml = (text: string) => {
                return text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            };

            // Escaping must happen BEFORE markdown syntax replacement to avoid breaking generated tags
            // However, we must preserve the code blocks structure, so we handle them carefully.
            // Strategy: Escape everything, then process markdown.

            // 1. Escape the full content first
            content = escapeHtml(content);

            // 2. Since we escaped, markdown syntax like characters are safe (#, *, -).
            // But we need to handle potential escaped code blocks if they used angle brackets.

            // Triple backticks replacement (Code Blocks) - Improved Styling
            content = content.replace(/```([\s\S]*?)```/g, (_, code) => {
                return `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #6366f1; border-radius: 6px; padding: 16px 20px; margin: 25px 0; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.9em; white-space: pre-wrap; color: #334155; line-height: 1.6; page-break-inside: avoid;">${code.trim()}</div>`;
            });

            content = content
                .replace(/^### (.*$)/gim, "<h3 style=\"color: #4338ca; margin-top: 30px; margin-bottom: 12px; font-family: 'Segoe UI', sans-serif; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px; page-break-after: avoid;\"><span style=\"width: 6px; height: 6px; background: #6366f1; border-radius: 50%; display: inline-block;\"></span>$1</h3>")
                .replace(/^## (.*$)/gim, "<h2 style=\"color: #1e1b4b; margin-top: 40px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; font-family: 'Segoe UI', sans-serif; font-size: 24px; font-weight: 700; page-break-after: avoid;\">$1</h2>")
                .replace(/^# (.*$)/gim, "<h1 style=\"color: #1e1b4b; margin-top: 50px; text-align: center; font-size: 30px; font-weight: 800; page-break-after: avoid;\">$1</h1>")
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #312e81; font-weight: 700;">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em style="color: #4b5563;">$1</em>')
                // Inline code (single backticks)
                .replace(/`([^`]+)`/g, "<span style=\"background: #eef2ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 0.9em; border: 1px solid #c7d2fe;\">$1</span>")
                // REMOVE IMAGES: Strip markdown image syntax completely (return empty string)
                .replace(/!\[(.*?)\]\((.*?)\)/g, '')
                // Blockquotes / Important Notes - Refined
                .replace(/^> (.*$)/gim, '<div class="callout" style="background: #fff5f5; border-left: 4px solid #ef4444; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.02); page-break-inside: avoid;"><strong style="color: #b91c1c; display: block; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Important Note</strong><span style="color: #7f1d1d; line-height: 1.6;">$1</span></div>')
                .replace(/^- (.*$)/gim, '<li style="margin: 8px 0; padding-left: 5px; color: #334155;">$1</li>')
                .replace(/^\d+\. (.*$)/gim, '<li style="margin: 8px 0; padding-left: 5px; color: #334155;">$1</li>')
                .replace(/\n\n/g, '</p><p style="margin: 18px 0; color: #1e293b; line-height: 1.8;">')
                .replace(/\n/g, '<br>');

            htmlContent += `<div style="font-size: 15px;">${content}</div></div>`;

            // Add PYQs section
            if (doc.pyqs && doc.pyqs.length > 0) {
                htmlContent += `
                <div style="position: relative; z-index: 1; margin-top: 50px; background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #0f172a; margin-top: 0; text-align: center; font-family: 'Segoe UI', sans-serif;">🎯 Past Year Questions Overlay</h2>
                    <ol style="padding-left: 20px; color: #334155;">
                        ${doc.pyqs.map(q => `<li style="margin: 12px 0; font-size: 15px; line-height: 1.6;">${q}</li>`).join('')}
                    </ol>
                </div>
            `;
            }

            htmlContent += `
            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                Study Smarter with Exam Compass AI • www.examcompass.web.app
            </div>
        `;

            container.innerHTML = htmlContent;
            document.body.appendChild(container);

            // Wait for images to load with a timeout safety
            const images = Array.from(container.querySelectorAll('img'));
            const imagePromises = images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if error
                });
            });

            // Race between images loading and a 5-second timeout
            await Promise.race([
                Promise.all(imagePromises),
                new Promise(resolve => setTimeout(resolve, 5000))
            ]);

            // Generate PDF
            const options = {
                margin: [15, 15, 15, 15] as [number, number, number, number],
                filename: `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            try {
                await html2pdf().set(options).from(container).save();
            } catch (error) {
                console.error("PDF Generation Failed:", error);
                alert("Could not generate PDF. Please try again.");
            } finally {
                document.body.removeChild(container);
                setDownloadingId(null);
            }
        } catch (e) {
            console.error("Download Error", e);
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-4 animate-fade-in-up h-[calc(100vh-10rem)] lg:h-[calc(100vh-9rem)] flex flex-col min-h-0 overflow-hidden">
            <header className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-text-main">Smart Documents</h1>
                    <p className="text-text-muted">AI Note Generator & Repository</p>
                </div>
                <button
                    onClick={() => { setSelectedDoc(null); setViewMode('edit'); }}
                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 flex items-center gap-2"
                >
                    <Plus size={20} /> New Note
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0">
                {/* Sidebar List */}
                <div className="lg:col-span-3 glass-card flex flex-col overflow-hidden h-full min-h-0">
                    <div className="p-4 border-b border-border bg-surface/50">
                        <h3 className="font-bold text-text-main flex items-center gap-2">
                            <BookOpen size={18} /> Library
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {documents.length === 0 && (
                            <div className="text-center text-text-muted text-sm p-4">No notes safely saved yet.</div>
                        )}
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => { setSelectedDoc(doc); setViewMode('view'); }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all group relative ${selectedDoc?.id === doc.id ? 'bg-primary/10 border-primary/50' : 'bg-surface border-border hover:bg-white/5'
                                    }`}
                            >
                                <h4 className="font-bold text-text-main truncate text-sm">{doc.title}</h4>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                                        <Clock size={10} /> {new Date(doc.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(doc.id, e)}
                                        className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 glass-card flex flex-col overflow-hidden relative h-full">
                    {viewMode === 'edit' ? (
                        <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <FileText size={18} /> Create New Note
                            </h3>
                            <textarea
                                className="flex-1 bg-surface border border-border rounded-xl p-6 resize-none focus:outline-none focus:border-primary text-text-main font-mono text-base leading-relaxed min-h-[300px]"
                                placeholder="Paste lecture notes, article text, or a topic here..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                onClick={handleSummarize}
                                disabled={loading || !input}
                                className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/25 transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                Generate AI Notes & Save
                            </button>
                        </div>
                    ) : selectedDoc ? (
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {/* Doc Header */}
                            <div className="p-6 border-b border-border bg-surface/50 flex justify-between items-start shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold text-text-main">{selectedDoc.title}</h2>
                                    <p className="text-xs text-text-muted mt-1">Generated on {new Date(selectedDoc.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDownload(selectedDoc)}
                                        disabled={downloadingId === selectedDoc.id}
                                        className="text-primary hover:text-primary/80 p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Download as PDF"
                                    >
                                        {downloadingId === selectedDoc.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                        <span className="text-sm font-medium hidden sm:inline">
                                            {downloadingId === selectedDoc.id ? 'Generating...' : 'Download'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedDoc.id, { stopPropagation: () => { } } as any)}
                                        className="text-red-400 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Delete Note"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Doc Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                <div className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-secondary prose-strong:text-text-main text-text-muted">
                                    <Suspense fallback={<div className="flex items-center gap-2 text-sm text-text-muted"><Loader2 className="animate-spin" size={16} /> Loading formatter...</div>}>
                                        <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                                    </Suspense>
                                </div>

                                {/* PYQs Section */}
                                {selectedDoc.pyqs && selectedDoc.pyqs.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-border">
                                        <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                                            <FileText className="text-secondary" /> Related Exam Questions (PYQs)
                                        </h3>
                                        <ul className="space-y-3">
                                            {selectedDoc.pyqs.map((q, i) => (
                                                <li key={i} className="p-3 bg-surface rounded-lg border border-border text-sm text-text-main flex gap-3">
                                                    <span className="font-bold text-secondary">Q{i + 1}.</span>
                                                    {q}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-4 opacity-50">
                            <Sparkles size={48} />
                            <p>Select a note or create a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, 
    Loader2, 
    Trash2, 
    Plus, 
    BookOpen, 
    Download, 
    Layout,
    Search, 
    Zap
} from 'lucide-react';
import { askAI } from '../../lib/ai';
import { useUserStore } from '../../store/userStore';
import { extractJSON } from '../../lib/utils';

// USE A SYNCHRONOUS IMPORT FOR THE PRINT VIEW TO ELIMINATE LAZY-LOADING RACE CONDITIONS
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Doc = {
    id: string;
    title: string;
    content: string; // Markdown
    pyqs: string[] | null;
    diagram?: string | null; // Mermaid Diagram Code
    created_at: string;
};

// Extremely Robust Mermaid component
const Mermaid = ({ chart, isPrint = false }: { chart: string, isPrint?: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState(false);

    useEffect(() => {
        const renderChart = async () => {
            if (ref.current && chart) {
                try {
                    const mermaid = (await import('mermaid')).default;
                    mermaid.initialize({ 
                        startOnLoad: false, 
                        theme: isPrint ? 'neutral' : 'dark', 
                        securityLevel: 'loose',
                        fontFamily: 'Inter, sans-serif',
                        themeVariables: isPrint ? {} : {
                            primaryColor: '#5d21df',
                            primaryTextColor: '#fff',
                            primaryBorderColor: '#5d21df',
                            lineColor: '#5d21df',
                            secondaryColor: '#153ae4',
                            tertiaryColor: '#1d1f29'
                        }
                    });
                    
                    let cleanChart = chart
                        .replace(/```mermaid/g, '')
                        .replace(/```/g, '')
                        .trim();
                    
                    const isXYChart = cleanChart.startsWith('xychart-beta');
                    
                    if (isXYChart) {
                        // Anti-Hallucination 1: Strip flow-chart 'notes' (habitual failure point)
                        cleanChart = cleanChart.split('\n').filter(line => !line.toLowerCase().includes('note ')).join('\n');
                        // Anti-Hallucination 2: Force newlines between core tags (AI collapses them into one line)
                        cleanChart = cleanChart.replace(/\s+(x-axis|y-axis|line|title)\s+/g, '\n$1 ');
                        // Anti-Hallucination 3: Un-bracket hallucinated labels on Y-axis or Title e.g. [Velocity] -> "Velocity"
                        cleanChart = cleanChart.replace(/(y-axis|title)\s+\["?(.*?)"?\]/g, '$1 "$2"');
                        
                        // Anti-Hallucination 4: The AI sometimes completely hallucinates 2D arrays (e.g. line [[0, 0], [1, 2]])
                        const match2D = cleanChart.match(/line\s+(\[\[[\s\S]*?\]\])/);
                        if (match2D) {
                            try {
                                // Safely parse the hallucinated 2D array matrix into JS native arrays
                                const points = JSON.parse(match2D[1].replace(/'/g, '"'));
                                if (Array.isArray(points) && points.length > 0 && Array.isArray(points[0])) {
                                    const xCoords = points.map(p => p[0]);
                                    const yCoords = points.map(p => p[1]);
                                    // Delete any pre-existing broken x-axis lines to prevent duplicates
                                    cleanChart = cleanChart.replace(/x-axis.*?(\n|$)/g, '');
                                    // Re-inject the perfectly unwrapped separate flat arrays into the chart structure
                                    cleanChart = cleanChart.replace(match2D[0], `x-axis [${xCoords.join(', ')}]\nline [${yCoords.join(', ')}]`);
                                }
                            } catch (e) {
                                // If it fails to parse, we gracefully ignore and let the LLM fail natively.
                            }
                        }
                    } else {
                        // Protect flowchart nodes but do NOT run this on xychart arrays (e.g., line [0, 1, 2])
                        cleanChart = cleanChart.replace(/\[(.*?)\]/g, (_, p1) => `["${p1.replace(/["[\](){}]/g, '')}"]`);
                        cleanChart = cleanChart.replace(/\{(.*?)\}/g, (_, p1) => `{"${p1.replace(/["[\](){}]/g, '')}"}`);
                        
                        if (!cleanChart.match(/^(graph|flowchart|sequenceDiagram|pie|classDiagram|stateDiagram|erDiagram|gantt|journey|gitGraph|mindmap|timeline)/)) {
                            cleanChart = 'graph TD\n' + cleanChart;
                        }
                    }
                    
                    // Abort empty or "blank" successful graphs (e.g. LLM just spitting out "graph TD" with no nodes)
                    if (cleanChart.length < 15 || cleanChart.replace(/\s+/g, '') === 'graphTD' || cleanChart.replace(/\s+/g, '') === 'xychart-beta') {
                        setRenderError(true);
                        return;
                    }

                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, cleanChart);
                    
                    // Mermaid often swallows syntax errors into an embedded error SVG without throwing a JS exception.
                    // If we detect error vectors inside the output, abort the entire render so it doesn't leave an empty ghost box.
                    if (svg.includes('mermaid-error') || svg.includes('Syntax error') || svg.includes('failed to render')) {
                        setRenderError(true);
                        return;
                    }
                    
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                        setRenderError(false);
                    }
                } catch (e) {
                    console.warn("Mermaid dynamic render failed", e);
                    setRenderError(true);
                }
            }
        };
        renderChart();
    }, [chart, isPrint]);

    if (renderError) return null;

    return (
        <div className={`relative group ${isPrint ? 'my-4' : 'my-12'}`}>
            <div ref={ref} className={`flex justify-center rounded-[3rem] overflow-hidden ${isPrint ? 'bg-transparent p-0 border-none' : 'bg-white/2 p-10 border border-white/5 shadow-inner'}`} />
            <style dangerouslySetInnerHTML={{ __html: `
                .mermaid-error, #dmermaid-error, div[id^="dmermaid-"], .error-icon, .error-text { 
                    display: none !important; 
                    opacity: 0 !important; 
                    visibility: hidden !important; 
                }
            ` }} />
        </div>
    );
};

export const Notes = () => {
    const { user } = useUserStore();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [progressStatus, setProgressStatus] = useState('');
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Doc[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
    const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const shadowPrintRef = useRef<HTMLDivElement>(null);

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
            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setDocuments(data);
        } catch (e) {
            console.error("Failed to fetch docs", e);
        }
    };

    const handleSummarize = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setProgressStatus('Neural Alignment Initiated...');
        
        try {
            setProgressStatus('Archiving Metadata...');
            const metaPrompt = `Topic: "${input}". Return JSON: {"title": "Title", "pyqs": ["Q1", "Q2", "Q3", "Q4", "Q5"], "diagram": "graph TD; A[Main] --> B[Sub];"}`;
            const metaResponse = await askAI(metaPrompt, '', 'groq', [], { temperature: 0.1, jsonMode: true, stream: false });
            const metaData = extractJSON(metaResponse);

            if (!metaData) throw new Error("Metadata synthesis failed");

            const protoDoc: Doc = {
                id: 'temp-' + Date.now(),
                title: metaData.title || 'Untitled Archive',
                content: '> *Decoding Deep Theoretical Layers...*',
                pyqs: metaData.pyqs || [],
                diagram: metaData.diagram || null,
                created_at: new Date().toISOString()
            };

            setSelectedDoc(protoDoc);
            setViewMode('view');
            setInput('');

            setProgressStatus('Exhaustive Textbook Generation...');
            const chapterPrompt = `Generate EXHAUSTIVE Class 12 standard chapter on: "${input}". Use block math $$...$$. 3000 words. Density mandatory. 
CRITICAL RULES FOR DIAGRAMS/GRAPHS: For flowcharts, use standard mermaid \`graph TD\`. For ANY mathematical graphs, curves, or explicit X-Y plots (like v-t graphs, x=y^2), you MUST use mermaid \`xychart-beta\` using EXACTLY this syntax:
\`\`\`mermaid
xychart-beta
  x-axis [0, 1, 2, 3, 4, 5, 6]
  y-axis "Label" 0 --> 20
  line [0, 2, 4, 6, 8, 10, 12]
\`\`\`
1. NEVER use 2D point arrays like [[0,0], [1,1]]. You MUST use two separate flat arrays.
2. NEVER use 'note' or flowchart commands syntax inside mathematical plots.
3. Calculate high-resolution coordinates (at least 5-8 points) for smooth mathematical curves.
4. Lengths of x-axis array and line array MUST match exactly. Do NOT use graph TD for mapping equations.`;

            const stream = await askAI(
                chapterPrompt, 
                '', 
                'groq', 
                [], 
                { stream: true, modelId: "llama-3.3-70b-versatile", max_tokens: 8192 }
            );

            let fullContent = '';
            if (stream && typeof stream !== 'string') {
                for await (const chunk of stream) {
                    const text = chunk.choices?.[0]?.delta?.content || "";
                    if (text) {
                        fullContent += text;
                        setSelectedDoc(prev => prev ? { ...prev, content: fullContent } : null);
                    }
                }
            } else if (typeof stream === 'string') {
                fullContent = stream;
                setSelectedDoc(prev => prev ? { ...prev, content: fullContent } : null);
            }

            const { db } = await import('../../lib/firebase');
            const { collection, addDoc } = await import('firebase/firestore');

            const finalDocData = {
                user_id: user?.id,
                title: protoDoc.title,
                content: fullContent,
                pyqs: protoDoc.pyqs,
                diagram: protoDoc.diagram,
                created_at: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'documents'), finalDocData);
            const saved = { ...finalDocData, id: docRef.id } as Doc;

            setDocuments(prev => [saved, ...prev.filter(d => !d.id.startsWith('temp-'))]);
            setSelectedDoc(saved);

        } catch (e) {
            console.error("Synthesis error:", e);
        } finally {
            setLoading(false);
            setProgressStatus('');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this archive?")) return;
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
        if (!shadowPrintRef.current) return;
        setDownloadingId(doc.id);
        
        try {
            const html2pdf = (await import('html2pdf.js')).default;

            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (!shadowPrintRef.current) return;
            
            // CRITICAL FIX: Extracting the fully mounted HTML. No explicit width/windowWidth constraints are placed 
            // to allow html2canvas to capture the native responsive size exactly as rendered and gracefully scale it to JS-PDF's A4 width,
            // preventing the right-side box-sizing truncation problem completely.
            // MATH & GRAPH FIX: Injected KaTeX CSS explicitly to prevent fraction bars from collapsing into strikethroughs, and forced Mermaid SVGs to width: 100% to fix tiny graphs.
            const syntheticHtml = `
                <div id="pdf-shadow-renderer" style="background-color: #ffffff; color: #000000; padding: 10px 40px; box-sizing: border-box; overflow-wrap: break-word;">
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
                    <style>
                        #pdf-shadow-renderer .mermaid svg, #pdf-shadow-renderer .mermaid-container svg { width: 100% !important; max-width: 100% !important; height: auto !important; }
                        /* CRITICAL MATH FIX: Fix fraction bar (strikethrough) alignment by forcing KaTeX vertical alignment tokens */
                        #pdf-shadow-renderer .katex .mfrac .frac-line { 
                            border-bottom-width: 1.5pt !important; 
                            position: static !important;
                            display: block !important;
                            margin: 2px 0 !important;
                        }
                        #pdf-shadow-renderer .katex .vlist-t { vertical-align: middle !important; }
                    </style>
                    ${shadowPrintRef.current.innerHTML}
                </div>
            `;
            
            const options = {
                margin: [15, 10, 15, 10], // Slightly tighter horizontal margin to maximize A4 real estate
                filename: `${doc.title.replace(/\s+/g, '_').toLowerCase()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    logging: false,
                    letterRendering: true
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await (html2pdf() as any).set(options).from(syntheticHtml).save();
            setDownloadingId(null);
        } catch (e) {
            console.error("Ironclad export failed", e);
            setDownloadingId(null);
        }
    };

    const filteredDocs = documents.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-3rem)] flex flex-col bg-[#0a0a0f] overflow-hidden rounded-[2.5rem] border border-white/10 animate-fade-in shadow-2xl relative">
            <header className="px-8 lg:px-10 py-5 border-b border-white/5 bg-[#0f0f18]/60 backdrop-blur-3xl flex items-center justify-between shrink-0 relative z-50">
                <main className="flex items-center gap-6">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary shadow-2xl shadow-primary/5">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl lg:text-3xl font-heading font-black text-white tracking-tight">
                                My Notebook
                            </h1>
                            <span className="text-[9px] lg:text-[10px] px-2.5 py-1 bg-primary/20 text-primary rounded-full font-black uppercase tracking-[0.2em] border border-primary/30">AI Premium</span>
                        </div>
                    </div>
                </main>
                
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setSelectedDoc(null); setViewMode('edit'); }}
                        className="px-5 lg:px-6 py-2.5 lg:py-3 bg-white text-black text-xs lg:text-sm font-black rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-2.5 shadow-xl group border-2 border-primary/10"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
                        <span className="hidden sm:inline">New Draft</span>
                    </button>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2.5 text-text-muted hover:text-white bg-white/5 rounded-2xl border border-white/10 transition-colors"
                    >
                        <Layout size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex min-h-0 relative overflow-hidden">
                <aside className={`
                    ${isSidebarOpen ? 'w-full lg:w-96' : 'w-0 overflow-hidden opacity-0'} 
                    absolute lg:relative h-full bg-[#0a0a0f]/40 border-r border-white/5 backdrop-blur-md transition-all duration-500 ease-in-out z-40 flex flex-col shrink-0
                `}>
                    <div className="p-6 space-y-4">
                        <div className="relative group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors font-black" />
                            <input 
                                type="text"
                                placeholder="Search archives..."
                                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-[1.25rem] text-sm focus:outline-none focus:border-primary/50 transition-all font-bold tracking-tight"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 custom-scrollbar">
                        {filteredDocs.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => { setSelectedDoc(doc); setViewMode('view'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
                                className={`w-full p-6 rounded-[1.75rem] text-left border-2 transition-all active:scale-[0.98] ${selectedDoc?.id === doc.id ? 'bg-primary/5 border-primary/40 shadow-2xl' : 'bg-white/2 hover:bg-white/5 border-transparent hover:border-white/10'}`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <h3 className={`font-black text-sm lg:text-base leading-snug flex-1 ${selectedDoc?.id === doc.id ? 'text-primary' : 'text-text-main'}`}>{doc.title}</h3>
                                    <div className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 opacity-20 hover:opacity-100 transition-all flex items-center justify-center scale-90 hover:scale-100" onClick={(e) => handleDelete(doc.id, e)}>
                                        <Trash2 size={14} />
                                    </div>
                                </div>
                                <p className="text-xs text-text-muted mt-3 line-clamp-2 opacity-50 font-bold leading-relaxed">{doc.content.substring(0, 50).replace(/[#*`]/g, '')}...</p>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-h-0 bg-[#10101a]/30 overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                        {viewMode === 'edit' || !selectedDoc ? (
                            <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
                                <div className="text-center space-y-4">
                                    <h2 className="text-5xl lg:text-7xl font-heading font-black text-white tracking-tighter italic">Intelligence.</h2>
                                    <p className="text-text-muted text-base lg:text-lg font-bold opacity-40">Synthesize board-ready chapters instantly.</p>
                                </div>
                                <textarea
                                    className="w-full bg-black/60 border-2 border-white/10 rounded-[2.5rem] p-10 text-lg lg:text-2xl text-white font-bold focus:outline-none focus:border-primary/40 transition-all font-mono leading-relaxed h-[300px] resize-none"
                                    placeholder="Enter topic..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button
                                    onClick={handleSummarize}
                                    disabled={loading || !input}
                                    className="w-full py-8 bg-white text-black font-black text-xl rounded-[2.25rem] hover:bg-primary hover:text-white transition-all shadow-2xl flex items-center justify-center gap-6"
                                >
                                    {loading ? <div className="flex items-center gap-4"><Loader2 className="animate-spin" size={28} /> <span>{progressStatus || 'Synthesizing...'}</span></div> : <>Generate Advanced Archives <Sparkles size={24} /></>}
                                </button>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto px-6 lg:px-24 py-16 space-y-16">
                                <div className="text-center space-y-8 pb-12 border-b border-white/5">
                                    <h1 className="text-3xl lg:text-5xl font-heading font-black text-white leading-tight">{selectedDoc.title}</h1>
                                    <button
                                        onClick={() => handleDownload(selectedDoc)}
                                        disabled={downloadingId === selectedDoc.id}
                                        className="px-10 py-4 bg-white text-black hover:bg-primary hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-3 mx-auto shadow-2xl border-2 border-primary/20"
                                    >
                                        {downloadingId === selectedDoc.id ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                                        {downloadingId === selectedDoc.id ? 'Securing Archive...' : 'Export Final PDF'}
                                    </button>
                                </div>

                                {selectedDoc.diagram && <Mermaid chart={selectedDoc.diagram} />}
                                <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-xl text-text-muted/80 leading-relaxed font-serif">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]} 
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const content = String(children).trim();
                                                const isMermaid = /language-(mermaid|xychart-beta)/.test(className || '') || content.startsWith('xychart-beta') || content.startsWith('graph TD');
                                                
                                                if (!inline && isMermaid) {
                                                    return <Mermaid chart={content.replace(/```mermaid\n?|```/g, '')} />;
                                                }
                                                
                                                return (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}
                                    >
                                        {selectedDoc.content}
                                    </ReactMarkdown>
                                </article>

                                {selectedDoc.pyqs && selectedDoc.pyqs.length > 0 && (
                                    <div className="p-16 bg-white/2 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
                                        <h3 className="text-3xl font-heading font-black text-white mb-12 flex items-center gap-5">
                                            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-black shadow-2xl shrink-0">
                                                <Zap size={24} />
                                            </div>
                                            Critical Reflection
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            {selectedDoc.pyqs.map((q, i) => (
                                                <div key={i} className="p-8 bg-black/40 border border-white/5 rounded-[2rem] text-white hover:border-primary/50 transition-all font-bold text-xl leading-normal">
                                                    <span className="text-primary opacity-20 mr-4 font-mono">0{i+1}</span> {q}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* IRONCLAD SHADOW RENDERER (VISIBLE TO BROWSER BUT OFF-SCREEN) */}
            {selectedDoc && (
                <div 
                    ref={shadowPrintRef}
                    id="pdf-shadow-renderer"
                    className="absolute top-0 left-0 w-[800px] bg-white text-black p-16 -z-10 pointer-events-none"
                    style={{ fontFamily: "'Times New Roman', serif", visibility: 'hidden' }}
                >
                    <style dangerouslySetInnerHTML={{ __html: `
                        * { box-sizing: border-box; word-wrap: break-word; }
                        #pdf-shadow-renderer h1 { font-size: 32pt; text-align: center; color: #4338ca; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 40px; font-weight: 900; }
                        #pdf-shadow-renderer h2 { font-size: 24pt; color: #1e1b4b; border-left: 12px solid #6366f1; padding-left: 20px; background: #f8fafc; margin-top: 50px; padding-block: 20px; font-weight: 800; page-break-after: avoid; }
                        #pdf-shadow-renderer h3 { font-size: 18pt; color: #4338ca; margin-top: 35px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
                        #pdf-shadow-renderer p, #pdf-shadow-renderer li { font-size: 13pt; line-height: 1.8; color: #1e293b; margin-bottom: 18px; text-align: justify; }
                        #pdf-shadow-renderer .katex { font-size: 1.1em !important; }
                        #pdf-shadow-renderer .katex-display { margin: 2.5em 0 !important; }
                        #pdf-shadow-renderer blockquote { border-left: 6px solid #e2e8f0; padding-left: 30px; font-style: italic; color: #64748b; margin: 30px 0; }
                        #pdf-shadow-renderer .practice-box { margin-top: 80px; padding: 50px; border: 5px solid #6366f1; border-radius: 32px; background: #ffffff; page-break-inside: avoid; }
                        #pdf-shadow-renderer table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                        #pdf-shadow-renderer th, #pdf-shadow-renderer td { border: 1px solid #e2e8f0; padding: 12px; font-size: 11pt; }
                        #pdf-shadow-renderer th { background: #f8fafc; font-weight: 800; }
                    ` }} />
                    <div style={{ backgroundColor: '#ffffff', minHeight: '100%' }}>
                        <h1>{selectedDoc.title}</h1>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px', paddingBottom: '20px', borderBottom: '3px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '15pt', fontWeight: 900, color: '#4338ca', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                                    Exam Compass
                                </div>
                                <div style={{ fontSize: '9pt', fontWeight: 800, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    Premium Intelligence • 100% Verified
                                </div>
                                <div style={{ fontSize: '8pt', fontWeight: 600, color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                                    Pioneering Next-Gen Academic Excellence.
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                                <div style={{ fontSize: '11pt', fontWeight: 800, color: '#1e293b' }}>
                                    Prepared for {user?.name || 'Scholar'}
                                </div>
                                <div style={{ fontSize: '9pt', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>
                                    Founder: {user?.name || 'Admin'}
                                </div>
                                <div style={{ fontSize: '8pt', fontWeight: 600, color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px' }}>
                                    REF: {selectedDoc.id.substring(0,8).toUpperCase()} • {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        {selectedDoc.diagram && <Mermaid chart={selectedDoc.diagram} isPrint={true} />}
                        <div className="prose-print" style={{ backgroundColor: '#ffffff' }}>
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const content = String(children).trim();
                                        const isMermaid = /language-(mermaid|xychart-beta)/.exec(className || '') || content.startsWith('xychart-beta') || content.startsWith('graph TD');
                                        
                                        if (!inline && isMermaid) {
                                            return <Mermaid chart={content.replace(/```mermaid\n?|```/g, '')} isPrint={true} />;
                                        }
                                        
                                        return (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {selectedDoc.content}
                            </ReactMarkdown>
                        </div>
                        {selectedDoc.pyqs && selectedDoc.pyqs.length > 0 && (
                            <div className="practice-box">
                                <h2 style={{ border: 'none', background: 'transparent', padding: 0, margin: '0 0 40px', textAlign: 'center', fontSize: '26pt' }}>🎯 Critical Reflection</h2>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {selectedDoc.pyqs.map((q, i) => (
                                        <li key={i} style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '25px', marginBottom: '30px', fontWeight: 700, fontSize: '14pt' }}>
                                            <span style={{ color: '#6366f1', marginRight: '20px', fontSize: '10pt', opacity: 0.5 }}>QUEST_${i+1}</span> {q}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

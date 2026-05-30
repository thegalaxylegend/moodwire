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
    Zap,
    AlertCircle
} from 'lucide-react';
import { exportPremiumPDF } from '../../lib/pdfExporter';
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
    created_at: string;
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
    const [noteType, setNoteType] = useState<'full' | 'exam'>('full');
    const [quotaExhausted, setQuotaExhausted] = useState<{ isExhausted: boolean; message?: string }>({ isExhausted: false });
    const abortControllerRef = useRef<AbortController | null>(null);

    const shadowPrintRef = useRef<HTMLDivElement>(null);

    const getNoteColor = (title: string, index: number) => {
        const colors = [
            { text: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-l-indigo-500', glow: 'shadow-indigo-500/10' },
            { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-l-emerald-500', glow: 'shadow-emerald-500/10' },
            { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-l-rose-500', glow: 'shadow-rose-500/10' },
            { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-l-amber-500', glow: 'shadow-amber-500/10' },
            { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-l-cyan-500', glow: 'shadow-cyan-500/10' },
            { text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-l-fuchsia-500', glow: 'shadow-fuchsia-500/10' }
        ];

        // Specific overrides based on title hints
        const lower = title.toLowerCase();
        if (lower.includes('phys')) return colors[0]; // Physics -> Indigo
        if (lower.includes('chem')) return colors[1]; // Chem -> Emerald
        if (lower.includes('bio')) return colors[2];  // Bio -> Rose
        if (lower.includes('math')) return colors[5]; // Math -> Fuchsia
        if (lower.includes('revision')) return colors[3]; // Revision -> Amber

        return colors[index % colors.length];
    };

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

    const handleAbort = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setLoading(false);
            setProgressStatus('Generation Terminated.');
        }
    };

    const handleSummarize = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setProgressStatus('Neural Alignment Initiated...');
        
        // Auto-detect mode from input
        const lowerInput = input.toLowerCase();
        const detectedMode = (lowerInput.includes('revision') || lowerInput.includes('short') || lowerInput.includes('summary') || lowerInput.includes('cheat sheet')) ? 'exam' : noteType;

        // Dynamic Subject Detection from input
        let subject = "General Academics";
        if (
            lowerInput.includes("physics") || lowerInput.includes("electrostatics") || lowerInput.includes("magnetism") || 
            lowerInput.includes("thermodynamics") || lowerInput.includes("force") || lowerInput.includes("motion") || 
            lowerInput.includes("optics") || lowerInput.includes("light") || lowerInput.includes("electricity") || 
            lowerInput.includes("gravitation") || lowerInput.includes("mechanics") || lowerInput.includes("waves")
        ) {
            subject = "Physics";
        } else if (
            lowerInput.includes("chemistry") || lowerInput.includes("organic") || lowerInput.includes("inorganic") || 
            lowerInput.includes("chemical") || lowerInput.includes("atoms") || lowerInput.includes("molecules") || 
            lowerInput.includes("equilibrium") || lowerInput.includes("reaction") || lowerInput.includes("bonding") || 
            lowerInput.includes("periodic") || lowerInput.includes("thermo") || lowerInput.includes("solutions")
        ) {
            subject = "Chemistry";
        } else if (
            lowerInput.includes("biology") || lowerInput.includes("botany") || lowerInput.includes("zoology") || 
            lowerInput.includes("cell") || lowerInput.includes("genetics") || lowerInput.includes("human") || 
            lowerInput.includes("plant") || lowerInput.includes("morphology") || lowerInput.includes("photosynthesis") || 
            lowerInput.includes("anatomy") || lowerInput.includes("disease") || lowerInput.includes("ecosystem")
        ) {
            subject = "Biology";
        } else if (
            lowerInput.includes("math") || lowerInput.includes("calculus") || lowerInput.includes("algebra") || 
            lowerInput.includes("geometry") || lowerInput.includes("probability") || lowerInput.includes("trigonometry") || 
            lowerInput.includes("quadratic") || lowerInput.includes("derivatives") || lowerInput.includes("integration") || 
            lowerInput.includes("matrix") || lowerInput.includes("vector") || lowerInput.includes("limits")
        ) {
            subject = "Mathematics";
        }

        // Detect user's explicit structural constraints
        const explicitConstraints: string[] = [];
        if (lowerInput.includes("point") || lowerInput.includes("bullet")) {
            explicitConstraints.push("FORMAT: Use strict point-wise/bulleted structure as requested.");
        }
        if (lowerInput.includes("simple") || lowerInput.includes("easy")) {
            explicitConstraints.push("LANGUAGE: Use the simplest explanation style possible, breaking down jargon into layman's terms.");
        }
        if (lowerInput.includes("example") || lowerInput.includes("solved")) {
            explicitConstraints.push("EXAMPLES: Add extra solved step-by-step examples demonstrating the concepts.");
        }
        if (lowerInput.includes("derivation") || lowerInput.includes("derive")) {
            explicitConstraints.push("DERIVATION: Show highly detailed, step-by-step mathematical derivations in KaTeX.");
        }
        if (lowerInput.includes("10 point") || lowerInput.includes("ten point")) {
            explicitConstraints.push("LENGTH: Strictly limit the primary conceptual sections to exactly 10 comprehensive points.");
        }
        if (lowerInput.includes("formula") || lowerInput.includes("equation")) {
            explicitConstraints.push("EQUATIONS: Include a rigorous and exhaustive index of all active formulas.");
        }

        try {
            abortControllerRef.current = new AbortController();
            
            setProgressStatus('Archiving Metadata...');
            const metaPrompt = `Create a highly professional academic metadata JSON for the following student request: "${input}". 
            The target subject is: ${subject}. 
            The target class/grade is: ${user?.userClass || 'Class 12th'}.
            The student might have specified custom styling (e.g. "point wise", "simplest way possible"). Parse the intent and reflect it in the Title.
            
            Return JSON in this EXACT schema (do not output markdown formatting blocks around JSON, do not include trailing commas):
            {
              "title": "A beautiful, premium academic title (e.g., 'ELECTROSTATICS | Complete Concept Guide' or 'PHOTOSYNTHESIS | Point-Wise Quick Revision')",
              "pyqs": [
                "A highly realistic, challenging JEE/NEET/Board exam question 1 covering this topic",
                "A highly realistic, challenging JEE/NEET/Board exam question 2 covering this topic",
                "A highly realistic, challenging JEE/NEET/Board exam question 3 covering this topic",
                "A highly realistic, challenging JEE/NEET/Board exam question 4 covering this topic",
                "A highly realistic, challenging JEE/NEET/Board exam question 5 covering this topic"
              ]
            }`;

            const metaResponse = await askAI(
                "You are an Elite Academic Registrar. Your sole job is to synthesize beautiful chapter metadata in strictly valid JSON format matching the schema requested.",
                metaPrompt,
                'groq',
                [],
                { 
                    temperature: 0.1, 
                    jsonMode: true, 
                    stream: false,
                    signal: abortControllerRef.current.signal 
                }
            );
            const metaData = extractJSON(metaResponse);

            if (!metaData) throw new Error("Metadata synthesis failed");

            const protoDoc: Doc = {
                id: 'temp-' + Date.now(),
                title: metaData.title || 'Untitled Archive',
                content: '> *Decoding Deep Theoretical Layers...*',
                pyqs: metaData.pyqs || [],
                created_at: new Date().toISOString()
            };

            setSelectedDoc(protoDoc);
            setViewMode('view');
            setInput('');

            setProgressStatus(detectedMode === 'exam' ? 'Synthesizing Revision Excellence...' : 'Exhaustive Textbook Generation...');
            
            const constraintAlert = explicitConstraints.length > 0
                ? `\n⚠️ MANDATORY CRITICAL USER INSTRUCTIONS OVERRIDE:\n${explicitConstraints.join('\n')}\nYOU MUST OVERRIDE STANDARD STRUCTURE TO FULFILL THESE DIRECTIVES.`
                : '';

            const chapterPrompt = detectedMode === 'exam' 
                ? `INSTRUCTION: ${input}
                   SUBJECT: ${subject}
                   CLASS: ${user?.userClass || 'Class 12th'}
                   STYLE: High-Yield Exam Revision Cards

                   ${constraintAlert}

                   STANDARD HIGH-YIELD REVISION NOTE STRUCTURE (Apply if no conflicting user override):
                   - Use a structured, professional outline. Start directly with a H1 Title of the chapter.
                   - Use STRICT, dense bullet points for all theories. Avoid blocks of prose.
                   - Keep points to a maximum of 1-3 lines of high-information density.
                   - **Bold** every critical definition, parameter, constant, and physical quantity.
                   - Core Sections to include:
                     1. H2: "Syllabus Snapshot & Exam Weightage" (A compact table or list summarizing the high-yield subtopics and their frequency in recent papers).
                     2. H2: "High-Yield Concept Sheets" (Point-wise revision lists covering core conceptual pillars).
                     3. H2: "🔑 Formula Directory" (A clear table or structured list mapping every core equation in LaTeX, including explanations for all variables).
                     4. H2: "⚠️ Pitfalls & Misconceptions" (A point-wise warning list detailing common traps students fall into during high-stakes exams, e.g. units, negative signs, vector directions).
                     5. H2: "💡 Mnemonics & Memory Aids" (Clever mnemonics to instantly recall taxonomies, series, groups, or biological processes).
                   - Formatting: Format all math in standard LaTeX: $...$ for inline equations and $$...$$ for centered block equations.
                   - Length: High information density, action-oriented. NO conversational fluff, no introductory greetings.`
                : `INSTRUCTION: ${input}
                   SUBJECT: ${subject}
                   CLASS: ${user?.userClass || 'Class 12th'}
                   STYLE: Exhaustive Theoretical Study Archive (Detailed Style)

                   ${constraintAlert}

                   STANDARD EXHAUSTIVE CONCEPT ARCHIVE STRUCTURE (Apply if no conflicting user override):
                   - Structure: Use clean Markdown hierarchy (H1 for Chapter Title, H2 for Major Topics, H3 for Subtopics). Start directly with H1.
                   - Coverage: Fulfill a ZERO-OMISSION POLICY. You MUST cover every single postulate, definition, law, theorem, derivation, boundary case, and structural exception for this topic. Missing any subtopic represents failure.
                   - Deep Foundations: Explain the conceptual basis, theoretical postulates, and fundamental physical/biological/chemical mechanics rigorously.
                   - Rigorous Derivations: Show step-by-step mathematical proofs or physical derivations. Write extensive mathematical annotations explaining transitions between equations in LaTeX.
                   - Subject-Specific Anchoring:
                     * PHYSICS: Focus on mathematical derivations, boundary limits, and conceptual applications.
                     * CHEMISTRY: Include complete chemical reactions, physical state changes, precise names of catalysts, structural isomer lists, and comparison tables of physical properties.
                     * BIOLOGY: Detail taxonomy hierarchies, anatomical pathways, process cycles, and clinical/functional importance.
                     * MATHEMATICS: Show full mathematical proofs, check for domain/range restrictions, highlight edge cases, and graph-like behaviors.
                   - Core Sections to include:
                     1. H2: "Chapter Blueprint & Core Objectives" (A formal map of the concepts to be mastered).
                     2. H2: "Deep Theoretical Foundations" (Dense concepts).
                     3. H2: "Mathematical Formulation & Proofs" (Step-by-step rigorous derivations).
                     4. H2: "Concept Comparison & Synoptic Tables" (Densely formatted Markdown comparison tables).
                     5. H2: "Solved Practical Masterclass" (Include exactly 3 highly challenging, conceptual problems solved step-by-step with deep explanations).
                   - Length: Complete, dense, textbook-level depth.
                   - Formatting: Format all math in standard LaTeX: $...$ for inline equations and $$...$$ for centered block equations.
                   - Tone: Highly formal, rigorous, and academic. NO introductory/conversational fluff.`;

            const stream = await askAI(
                `You are a Distinguished STEM Professor, Senior Syllabus Director, and Elite Academic Author for JEE, NEET, and CBSE Board Exams. 
                 Your purpose is to generate highly authoritative, mathematically rigorous, and structurally beautiful chapter notes in Markdown.
                 Ensure absolute factual accuracy. Use standard KaTeX formatting ($...$ and $$...$$) for all mathematics.`,
                chapterPrompt,
                'groq',
                [],
                { 
                    stream: true, 
                    modelId: "llama-3.3-70b-versatile", 
                    max_tokens: 8192,
                    signal: abortControllerRef.current.signal 
                }
            );

            let fullContent = '';
            let lastUpdate = Date.now();

            if (stream && typeof stream !== 'string') {
                for await (const chunk of stream) {
                    const text = chunk.choices?.[0]?.delta?.content || "";
                    if (text) {
                        fullContent += text;
                        
                        // Repetition Detection (Guardian Logic)
                        if (fullContent.length > 1000) {
                            const tail = fullContent.slice(-300);
                            const body = fullContent.slice(0, -300);
                            if (body.includes(tail)) {
                                console.warn("🚨 [AI] Repetition loop detected. Hard-breaking stream.");
                                break;
                            }
                        }

                        // Buffered UI Update (Throttle to every 100ms for performance)
                        if (Date.now() - lastUpdate > 100) {
                            setSelectedDoc(prev => prev ? { ...prev, content: fullContent } : null);
                            lastUpdate = Date.now();
                        }
                    }
                }
                // Final flush
                setSelectedDoc(prev => prev ? { ...prev, content: fullContent } : null);
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
                note_type: detectedMode,
                created_at: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'documents'), finalDocData);
            const saved = { ...finalDocData, id: docRef.id } as Doc;

            setDocuments(prev => [saved, ...prev.filter(d => !d.id.startsWith('temp-'))]);
            setSelectedDoc(saved);
            abortControllerRef.current = null;

        } catch (e: any) {
                if (e.name === 'AbortError') {
                    console.log("Stream aborted by user.");
                } else {
                    const errorMsg = e.message || String(e);
                    console.error("Synthesis error:", errorMsg);
                    
                    if (errorMsg.includes('DAILY_LIMIT_REACHED')) {
                        setQuotaExhausted({ isExhausted: true, message: errorMsg.replace('DAILY_LIMIT_REACHED: ', '') });
                        setProgressStatus('Daily Limit Reached.');
                    } else {
                        setProgressStatus('Synthesis Failed.');
                    }
                }
            } finally {
            setLoading(false);
            if (progressStatus !== 'Generation Terminated.') setProgressStatus('');
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
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (!shadowPrintRef.current) return;
            
            await exportPremiumPDF({
                title: doc.title,
                filename: `${doc.title.replace(/\s+/g, '_').toLowerCase()}.pdf`,
                category: 'Academic Archive',
                userName: user?.name || 'Scholar',
                userClass: user?.userClass || 'Class 12th',
                targetYear: user?.targetYear,
                docId: doc.id,
                isExamMode: (doc as any).note_type === 'exam' || doc.title.toLowerCase().includes('revision'),
                contentHtml: shadowPrintRef.current.innerHTML.replace(/<h1[^>]*>.*?<\/h1>/i, '') // Remote duplicate H1 as exporter adds its own or we handle it in style
            });

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
        <div className="h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-3rem)] flex flex-col bg-[#0a0a0f] overflow-hidden rounded-[2.5rem] border border-white/5 animate-fade-in shadow-2xl relative">
            <header className="px-4 sm:px-8 lg:px-10 py-4 lg:py-5 border-b border-white/5 bg-[#0f0f18]/60 backdrop-blur-3xl flex items-center justify-between shrink-0 relative z-50">
                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl border border-primary/20 text-primary shadow-xl shadow-black/20">
                        <BookOpen size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <h1 className="text-base sm:text-2xl lg:text-3xl font-heading font-black text-white tracking-tight">
                                My Notebook
                            </h1>
                            <span className="hidden xs:inline-block text-[8px] lg:text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] border border-primary/30">AI Premium</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                    <button type="button"
                        onClick={() => { setSelectedDoc(null); setViewMode('edit'); }}
                        className="p-2.5 sm:px-6 sm:py-3 bg-white text-black text-xs lg:text-sm font-black rounded-xl sm:rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-2.5 shadow-xl group border-2 border-primary/10"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
                        <span className="hidden sm:inline">New Draft</span>
                    </button>
                    <button type="button" 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 sm:p-2.5 text-text-muted hover:text-white bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 transition-colors"
                    >
                        <Layout size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex min-h-0 relative overflow-hidden">
                <aside className={`
                    ${isSidebarOpen ? 'w-full lg:w-96' : 'w-0 overflow-hidden opacity-0'} 
                    absolute lg:relative h-full bg-[#0a0a0f] lg:bg-[#0a0a0f]/40 border-r border-white/5 backdrop-blur-xl transition-all duration-500 ease-in-out z-40 flex flex-col shrink-0
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
                        {filteredDocs.map((doc, idx) => {
                            const colors = getNoteColor(doc.title, idx);
                            const isSelected = selectedDoc?.id === doc.id;
                            const isExam = (doc as any).note_type === 'exam' || doc.title.toLowerCase().includes('revision');

                            return (
                                <button type="button"
                                    key={doc.id}
                                    onClick={() => { setSelectedDoc(doc); setViewMode('view'); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
                                    className={`w-full p-6 rounded-r-[1.75rem] rounded-l-lg text-left border-2 transition-all active:scale-[0.98] border-l-[6px] ${isSelected ? `bg-white/10 border-white/30 ${colors.border} ${colors.glow} shadow-2xl scale-[1.02]` : `bg-black/40 hover:bg-white/5 border-white/10 hover:border-white/20 ${colors.border}/20`}`}
                                >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter ${isExam ? 'bg-amber-500/20 text-amber-500' : `${colors.bg} ${colors.text}`}`}>
                                                        {isExam ? 'Exam Revision' : 'Full Theory'}
                                                    </span>
                                                    {doc.title.toLowerCase().includes('class 12') && <span className="text-[7px] text-white/40 font-black uppercase tracking-widest px-1 border border-white/10 rounded">Grade 12</span>}
                                                </div>
                                                <h3 className={`font-black text-sm lg:text-base leading-snug ${isSelected ? 'text-white' : 'text-text-main'}`}>{doc.title}</h3>
                                            </div>
                                            <div className="size-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 opacity-20 hover:opacity-100 transition-all flex items-center justify-center scale-90 hover:scale-100" onClick={(e) => handleDelete(doc.id, e)}>
                                                <Trash2 size={14} />
                                            </div>
                                        </div>
                                    <p className="text-xs text-text-muted mt-3 line-clamp-2 opacity-50 font-bold leading-relaxed">{doc.content.substring(0, 50).replace(/[#*`]/g, '')}...</p>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-h-0 bg-[#10101a]/30 overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                        {viewMode === 'edit' || !selectedDoc ? (
                            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-24 space-y-8 lg:space-y-12">
                                <div className="text-center space-y-4">
                                    <h2 className="text-3xl sm:text-5xl lg:text-7xl font-heading font-black text-white tracking-tighter italic">Intelligence.</h2>
                                    <p className="text-text-muted text-sm sm:text-lg font-bold opacity-40 uppercase tracking-widest">Synthesize board-ready chapters</p>
                                </div>

                                <div className="flex justify-center scale-90 sm:scale-100">
                                    <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/5 flex gap-1 sm:gap-2">
                                        <button type="button" 
                                            onClick={() => setNoteType('exam')}
                                            className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${noteType === 'exam' ? 'bg-amber-500 text-black shadow-[0_10px_30px_-5px_rgba(245,158,11,0.3)]' : 'text-text-muted hover:text-white'}`}
                                        >
                                            Revision
                                        </button>
                                        <button type="button" 
                                            onClick={() => setNoteType('full')}
                                            className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${noteType === 'full' ? 'bg-white text-black shadow-2xl' : 'text-text-muted hover:text-white'}`}
                                        >
                                            Detailed
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    className="w-full bg-black/60 border-2 border-white/10 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 text-base sm:text-lg lg:text-2xl text-white font-bold focus:outline-none focus:border-primary/40 transition-all font-mono leading-relaxed h-[200px] lg:h-[300px] resize-none"
                                    placeholder="e.g. 'Photoelectric Effect in 20 points' or just 'Quadratic Equations' (will use direct-point format)"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button type="button"
                                    onClick={handleSummarize}
                                    disabled={loading || !input || quotaExhausted.isExhausted}
                                    className={`w-full py-6 lg:py-8 font-black text-lg lg:text-xl rounded-[1.75rem] lg:rounded-[2.25rem] transition-all shadow-2xl flex flex-col sm:flex-row items-center justify-center gap-2 lg:gap-6 ${
                                        quotaExhausted.isExhausted 
                                            ? 'bg-red-500/20 text-red-500 border-2 border-red-500/30 cursor-not-allowed' 
                                            : 'bg-white text-black hover:bg-primary hover:text-white'
                                    }`}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-6">
                                            <Loader2 className="animate-spin" size={28} /> 
                                            <span>{progressStatus || 'Synthesizing...'}</span>
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); handleAbort(); }}
                                                className="ml-4 px-4 py-2 bg-red-500 text-white text-[10px] rounded-full hover:bg-red-600 transition-colors uppercase tracking-tighter cursor-pointer"
                                            >
                                                Stop Generation
                                            </div>
                                        </div>
                                    ) : (
                                        <>{noteType === 'exam' ? 'Generate Exam Revision' : 'Generate Exhaustive Archive'} <Sparkles size={24} /></>
                                    )}
                                </button>

                                {quotaExhausted.isExhausted && (
                                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 animate-pulse">
                                        <AlertCircle className="text-red-500 shrink-0" size={24} />
                                        <div className="flex-1">
                                            <p className="text-red-500 font-bold text-sm lg:text-base">{quotaExhausted.message}</p>
                                            <p className="text-red-500/60 text-xs font-medium uppercase tracking-widest mt-1">Limits reset daily at 12:00 AM UTC</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto px-6 lg:px-24 py-16 space-y-16">
                                <div className="text-center space-y-4 lg:space-y-8 pb-8 lg:pb-12 border-b border-white/5">
                                    <div className="flex justify-center mb-4">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border ${((selectedDoc as any).note_type === 'exam' || selectedDoc.title.toLowerCase().includes('revision')) ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                                            {((selectedDoc as any).note_type === 'exam' || selectedDoc.title.toLowerCase().includes('revision')) ? 'Revision Mastery' : 'Full Archive'}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-black text-white leading-tight">{selectedDoc.title}</h1>
                                    <button type="button"
                                        onClick={() => handleDownload(selectedDoc)}
                                        disabled={downloadingId === selectedDoc.id}
                                        className={`px-8 lg:px-10 py-3 lg:py-4 font-black text-[10px] lg:text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-3 mx-auto shadow-2xl border-2 ${((selectedDoc as any).note_type === 'exam' || selectedDoc.title.toLowerCase().includes('revision')) ? 'bg-amber-500 text-black border-amber-500/20 hover:bg-white' : 'bg-white text-black hover:bg-primary hover:text-white border-primary/20'}`}
                                    >
                                        {downloadingId === selectedDoc.id ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                                        {downloadingId === selectedDoc.id ? 'Securing Archive...' : 'Export Final PDF'}
                                    </button>
                                </div>

                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]} 
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {selectedDoc.content}
                                    </ReactMarkdown>

                                {selectedDoc.pyqs && selectedDoc.pyqs.length > 0 && (
                                    <div className={`p-8 lg:p-16 rounded-[2.5rem] lg:rounded-[3.5rem] border relative overflow-hidden ${((selectedDoc as any).note_type === 'exam' || selectedDoc.title.toLowerCase().includes('revision')) ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white/2 border-white/5'}`}>
                                        <h3 className="text-xl lg:text-3xl font-heading font-black text-white mb-8 lg:text-12 flex items-center gap-3 lg:gap-5">
                                            <div className={`w-10 lg:w-14 h-10 lg:h-14 rounded-xl flex items-center justify-center text-black shadow-2xl shrink-0 ${((selectedDoc as any).note_type === 'exam' || selectedDoc.title.toLowerCase().includes('revision')) ? 'bg-amber-500' : 'bg-primary'}`}>
                                                <Zap size={20} />
                                            </div>
                                            Critical Reflection
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            {selectedDoc.pyqs.map((q, i) => (
                                                <div key={i} className={`p-6 lg:p-8 bg-black/40 border rounded-[1.5rem] lg:rounded-[2rem] text-white transition-all font-bold text-sm lg:text-xl leading-normal ${((selectedDoc as any).note_type === 'exam' || selectedDoc.title.toLowerCase().includes('revision')) ? 'hover:border-amber-500/50 border-white/5' : 'hover:border-primary/50 border-white/5'}`}>
                                                    <span className={`${((selectedDoc as any).note_type === 'exam' || selectedDoc.title.toLowerCase().includes('revision')) ? 'text-amber-500' : 'text-primary'} opacity-20 mr-4 font-mono`}>0{i+1}</span> {q}
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
                    <div style={{ backgroundColor: '#ffffff' }}>
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
                        <div className="prose-print" style={{ backgroundColor: '#ffffff' }}>
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
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

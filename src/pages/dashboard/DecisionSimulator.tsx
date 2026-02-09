import { useState } from 'react';
import { Scale, GraduationCap, DollarSign, Brain, RefreshCw } from 'lucide-react';
import { askAI } from '../../lib/ai';
import { extractJSON } from '../../lib/utils';
import { CustomSelect } from '../../components/CustomSelect';
import { AuthGate } from '../../components/auth/AuthGate';

const EXAM_OPTIONS = [
    { value: 'JEE Mains', label: 'JEE Mains' },
    { value: 'JEE Advanced', label: 'JEE Advanced' },
    { value: 'NEET UG', label: 'NEET UG' },
    { value: 'BITSAT', label: 'BITSAT' },
    { value: 'VITEEE', label: 'VITEEE' },
    { value: 'UPSC CSE', label: 'UPSC CSE' },
    { value: 'CLAT', label: 'CLAT' },
    { value: 'CAT', label: 'CAT' },
    { value: 'NDA', label: 'NDA' },
    { value: 'CUET', label: 'CUET' },
    { value: 'GATE', label: 'GATE' }
];

export const DecisionSimulator = () => {
    const [examA, setExamA] = useState('JEE Mains');
    const [examB, setExamB] = useState('NEET UG');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const handleCompare = async () => {
        setIsAnalyzing(true);
        setAnalysis(null);

        const prompt = `
            Compare ${examA} and ${examB} for an Indian student.
            Provide a strict JSON output with the following structure:
            {
                "examA": {
                    "seats": "Approx seats",
                    "applicants": "Approx applicants",
                    "acceptanceRate": "Percentage string",
                    "salary": "Avg salary range",
                    "pros": ["Pro 1", "Pro 2"],
                    "cons": ["Con 1", "Con 2"]
                },
                "examB": {
                    "seats": "Approx seats",
                    "applicants": "Approx applicants",
                    "acceptanceRate": "Percentage string",
                    "salary": "Avg salary range",
                    "pros": ["Pro 1", "Pro 2"],
                    "cons": ["Con 1", "Con 2"]
                },
                "verdict": "A brief, unbiased conclusion on who should choose which.",
                "riskScore": {
                    "examA": 8, // 1-10 scale
                    "examB": 6
                }
            }
        `;

        try {
            const response = await askAI("User is deciding between careers. Be realistic and data-backed.", prompt, 'groq');
            if (response) {
                const data = extractJSON(response);
                if (data) setAnalysis(data);
            }
        } catch (error) {
            console.error("Comparison failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-3xl font-heading font-bold text-text-main">Decision Simulator</h1>
                <p className="text-text-muted">AI-powered career path comparison engine.</p>
            </header>

            <AuthGate
                mode="modal"
                fallback={
                    <div className="glass-card p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Brain className="text-primary" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-text-main">Login to Simulate Career Paths</h2>
                        <p className="text-text-muted max-w-md mx-auto">
                            Compare exams, analyze risks, and get AI-powered verdicts tailored to your profile.
                        </p>
                    </div>
                }
            >
                {/* Comparison Controls */}
                <div className="glass-card p-6 flex flex-col items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center max-w-4xl">
                        <div className="w-full md:w-64">
                            <CustomSelect
                                value={examA}
                                onChange={setExamA}
                                options={EXAM_OPTIONS}
                                placeholder="Select Exam 1"
                            />
                        </div>

                        <div className="bg-surface p-3 rounded-full border border-border shrink-0 shadow-lg">
                            <Scale className="text-primary" />
                        </div>

                        <div className="w-full md:w-64">
                            <CustomSelect
                                value={examB}
                                onChange={setExamB}
                                options={EXAM_OPTIONS}
                                placeholder="Select Exam 2"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCompare}
                        disabled={isAnalyzing}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Brain />}
                        {isAnalyzing ? 'Analyzing Data...' : 'Run Simulation'}
                    </button>
                </div>

                {/* Results Grid */}
                {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative animate-fade-in-up">
                        {/* VS Badge */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex z-10 w-10 h-10 bg-background border border-border rounded-full items-center justify-center font-bold text-text-muted shadow-xl">
                            VS
                        </div>

                        {/* Left Card */}
                        <ExamCard name={examA} data={analysis.examA || {}} risk={analysis.riskScore?.examA || 0} color="border-t-primary" />

                        {/* Right Card */}
                        <ExamCard name={examB} data={analysis.examB || {}} risk={analysis.riskScore?.examB || 0} color="border-t-secondary" />

                        {/* Verdict */}
                        <div className="md:col-span-2 glass-card p-6 border-l-4 border-accent bg-accent/5">
                            <h3 className="font-bold text-text-main mb-2 flex items-center gap-2">
                                <Brain size={18} className="text-accent" /> AI Verdict
                            </h3>
                            <p className="text-text-muted">{analysis.verdict}</p>
                        </div>
                    </div>
                )}
            </AuthGate>
        </div>
    );
};

const ExamCard = ({ name, data, risk, color }: { name: string, data: any, risk: number, color: string }) => (
    <div className={`glass-card p-6 space-y-6 border-t-4 ${color}`}>
        <div className="flex justify-between items-start">
            <h3 className="text-2xl font-bold text-text-main">{name}</h3>
            <div className={`px-3 py-1 rounded text-xs font-bold border ${risk > 7 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                Risk: {risk}/10
            </div>
        </div>

        <div className="space-y-4">
            <div className="p-4 bg-surface rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-text-muted text-sm font-semibold">
                    <GraduationCap size={16} /> Competition
                </div>
                <div className="flex justify-between items-end">
                    <p className="text-lg font-bold text-text-main">{data?.applicants || 'N/A'}</p>
                    <p className="text-xs text-text-muted">{data?.seats || 'N/A'} Seats</p>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                    {/* Visual bar just for effect */}
                    <div className="bg-red-500 h-full w-[10%]"></div>
                </div>
                <p className="text-xs text-red-400">Acceptance: {data?.acceptanceRate || 'N/A'}</p>
            </div>

            <div className="p-4 bg-surface rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                    <DollarSign size={16} /> Potential ROI
                </div>
                <p className="text-lg font-bold text-text-main">{data?.salary || 'N/A'}</p>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-text-muted uppercase">Pros</p>
                <div className="flex flex-wrap gap-2">
                    {data?.pros?.map((p: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-green-500/5 text-green-400 border border-green-500/10">{p}</span>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-text-muted uppercase">Cons</p>
                <div className="flex flex-wrap gap-2">
                    {data?.cons?.map((c: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-red-500/5 text-red-400 border border-red-500/10">{c}</span>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

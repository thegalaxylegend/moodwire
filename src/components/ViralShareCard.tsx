import { useRef, useState } from 'react';
import { Trophy, Share2, Star } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ViralShareCardProps {
    score: number;
    total: number;
    topic: string;
    rank?: number;
    username: string;
}

export const ViralShareCard = ({ score, total, topic, username }: ViralShareCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    const percentage = Math.round((score / total) * 100);
    const quote = percentage > 90 ? "I'm unstoppable! 🚀" : percentage > 70 ? "Beating the competition! 🔥" : "Grinding my way up! 💪";

    const handleShare = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, { backgroundColor: '#111' });
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

            if (blob && navigator.share) {
                const file = new File([blob], 'exam-compass-score.png', { type: 'image/png' });
                await navigator.share({
                    title: 'Can you beat my score?',
                    text: `I just scored ${percentage}% in ${topic}! Join Exam Compass and see if you can beat me.`,
                    files: [file]
                });
            } else {
                // Fallback download
                const link = document.createElement('a');
                link.download = 'exam-compass-score.png';
                link.href = canvas.toDataURL();
                link.click();
            }
        } catch (e) {
            console.error("Share failed", e);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* The Invisible-ish Card (Visible for user to see what they share) */}
            <div ref={cardRef} className="relative w-[320px] h-[400px] bg-gradient-to-br from-indigo-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-6 flex flex-col items-center justify-between text-center font-outfit">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <div className="z-10 flex flex-col items-center gap-2 mt-4">
                    <div className="size-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
                        <Trophy size={32} className="text-yellow-400 drop-shadow-lg" />
                    </div>
                    <h3 className="text-white/80 text-sm tracking-widest uppercase font-bold">Exam Compass</h3>
                </div>

                <div className="z-10 py-6">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 drop-shadow-sm">
                        {percentage}%
                    </h1>
                    <p className="text-white/60 text-lg mt-1 font-medium">{topic}</p>
                </div>

                <div className="z-10 bg-white/5 backdrop-blur-sm rounded-xl p-4 w-full border border-white/10">
                    <p className="text-white text-lg font-bold italic">"{quote}"</p>
                    <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400">
                        <Star fill="currentColor" size={16} />
                        <Star fill="currentColor" size={16} />
                        <Star fill="currentColor" size={16} />
                        <Star fill="currentColor" size={16} />
                        <Star fill="currentColor" size={16} />
                    </div>
                </div>

                <div className="z-10 w-full flex justify-between items-end">
                    <div className="text-left">
                        <p className="text-white/40 text-[10px] uppercase font-bold">Player</p>
                        <p className="text-white font-bold">{username}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase font-bold">Beat Me At</p>
                        <p className="text-blue-400 font-bold text-sm">examcompass.pages.dev</p>
                    </div>
                </div>
            </div>

            <button type="button"
                onClick={handleShare}
                disabled={generating}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full font-bold text-white shadow-lg hover:shadow-pink-500/25 hover:scale-105 transition-all text-sm"
            >
                {generating ? 'Generating...' : <><Share2 size={18} /> Share Result Card</>}
            </button>
        </div>
    );
};

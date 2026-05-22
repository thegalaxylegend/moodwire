import { Info } from 'lucide-react';

const TIPS = [
    "I used to spend 5 hours just reading theory. My scores only jumped when I switched to 20% theory and 80% active question solving.",
    "Don't ignore the subjects you hate. The easiest questions often come from the chapters you skipped.",
    "A 6-hour sleep the night before the exam is worth more than 6 extra hours of cramming.",
    "If a question takes more than 3 minutes, guess, mark it for review, and move on immediately.",
    "Always analyze your mock tests the same day. Fixing one mistake is better than doing ten new questions."
];

function stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export const StudentTip = ({ seedText }: { seedText: string }) => {
    const index = stringToSeed(seedText) % TIPS.length;
    const tip = TIPS[index];

    return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-5 my-8">
            <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg flex-shrink-0">
                    <Info className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-1">Founder's Note</h4>
                    <p className="text-gray-300 text-sm italic">"{tip}"</p>
                    <p className="text-purple-400/80 text-xs mt-2 font-medium">— Ayush Kumar, Class 12 Student</p>
                </div>
            </div>
        </div>
    );
};

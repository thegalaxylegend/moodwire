import { Lightbulb } from 'lucide-react';

interface DirectAnswerBlockProps {
    title: string;
    description: string;
    keyFact?: string;
    impact?: string;
}

export const DirectAnswerBlock = ({ title, description, keyFact, impact }: DirectAnswerBlockProps) => {
    return (
        <div className="quick-summary bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 mb-8 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-500/20 p-1.5 rounded-lg flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Quick Summary</h3>
                    <p className="text-gray-200 leading-relaxed text-sm md:text-base">
                        <strong className="text-white font-medium">{title}</strong> {description}
                        {keyFact && <span className="block mt-2 text-blue-300 font-medium">✨ {keyFact}</span>}
                        {impact && <span className="block mt-1 text-gray-300">Target: {impact}</span>}
                    </p>
                </div>
            </div>
        </div>
    );
};

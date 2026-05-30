import { Lightbulb } from 'lucide-react';

interface DirectAnswerBlockProps {
    title: string;
    description: string;
    keyFact?: string;
    impact?: string;
}

export const DirectAnswerBlock = ({ title, description, keyFact, impact }: DirectAnswerBlockProps) => {
    return (
        <div 
            className="quick-summary bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 mb-8 shadow-sm"
            itemScope 
            itemType="https://schema.org/Question"
        >
            <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-500/20 p-1.5 rounded-lg flex-shrink-0">
                    <Lightbulb className="size-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="w-full">
                    {/* Explicitly tag the targeted query/question for AI Retrieval Engines */}
                    <h3 className="text-white font-semibold text-lg mb-2">
                        Quick Summary: <span itemProp="name">{title}</span>
                    </h3>
                    
                    {/* Accepted Answer scope tells LLM crawlers exactly where the verified answer content resides */}
                    <div 
                        itemProp="acceptedAnswer" 
                        itemScope 
                        itemType="https://schema.org/Answer"
                        className="text-gray-200 leading-relaxed text-sm md:text-base"
                    >
                        <p itemProp="text">
                            <strong className="text-white font-medium">{title}</strong> {description}
                            {keyFact && <span className="block mt-2 text-blue-300 font-medium">✨ {keyFact}</span>}
                            {impact && <span className="block mt-1 text-gray-300 text-xs">Target/Impact: {impact}</span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

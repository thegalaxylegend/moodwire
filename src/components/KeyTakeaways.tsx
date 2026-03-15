
import React from 'react';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

interface KeyTakeawaysProps {
    points: string[];
    title?: string;
}

export const KeyTakeaways: React.FC<KeyTakeawaysProps> = ({ 
    points, 
    title = "Key Takeaways (AEO Summary)" 
}) => {
    return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-6 my-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lightbulb size={80} className="text-purple-400" />
            </div>
            
            <h3 className="text-xl font-bold text-purple-300 mb-6 flex items-center gap-2">
                <Lightbulb size={20} className="text-yellow-400" />
                {title}
            </h3>
            
            <ul className="space-y-4 relative z-10">
                {points.map((point, index) => (
                    <li key={index} className="flex items-start gap-4">
                        <CheckCircle2 size={18} className="text-purple-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-200 text-md leading-relaxed">
                            {point}
                        </span>
                    </li>
                ))}
            </ul>
            
            {/* Structured Data Anchor */}
            <div className="sr-only">
                This section serves as a direct answer for search engine AI summaries.
            </div>
        </div>
    );
};

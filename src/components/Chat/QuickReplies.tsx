import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface QuickRepliesProps {
    suggestions: string[];
    onSelect: (text: string) => void;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({ suggestions, onSelect }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar mask-fade-right my-2">
            <div className="flex-shrink-0 p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Sparkles size={14} />
            </div>
            
            <div className="flex items-center gap-2 pb-1">
                {suggestions.map((text, index) => (
                    <motion.button
                        key={text}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        onClick={() => onSelect(text)}
                        className="whitespace-nowrap px-4 py-1.5 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 rounded-full text-[13px] font-medium text-white/70 hover:text-white transition-all flex items-center gap-2 group shadow-sm active:scale-95"
                    >
                        {text}
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { Bot, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    link?: string;
    linkText?: string;
    image?: string;
    isStreaming?: boolean;
}

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
    const isBot = message.sender === 'bot';

    // Performance Optimization: Only apply heavy plugins when NOT streaming 
    // or if the text is short. For now, let's just disable them during stream.
    const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
    const rehypePlugins = useMemo(() => {
        const plugins: any[] = [];
        if (!message.isStreaming) {
            plugins.push(rehypeKatex);
            plugins.push(rehypeHighlight);
        }
        return plugins;
    }, [message.isStreaming]);

    return (
        <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex items-end max-w-[85%] md:max-w-[80%] gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 
                    ${isBot ? 'bg-indigo-600 ring-2 ring-indigo-500/20' : 'bg-primary ring-2 ring-primary/20'}`}>
                    {isBot ? <Bot size={15} className="text-white" /> : <User size={15} className="text-white" />}
                </div>

                {/* Message Content Container */}
                <div className="flex flex-col gap-1.5">
                    {isBot && (
                        <div className="flex items-center gap-2 ml-1 mb-0.5">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Exa</span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                        </div>
                    )}
                    
                    <div className={`relative px-4 py-3 text-[14px] leading-relaxed shadow-xl transition-all duration-300
                        ${isBot 
                            ? 'bg-[#1a1c23] border border-white/5 text-gray-200 rounded-[22px] rounded-bl-[4px]' 
                            : 'bg-primary text-white rounded-[22px] rounded-br-[4px] shadow-primary/20'}
                        ${!message.text && !message.image ? 'hidden' : ''}`}>
                        
                        {message.image && (
                            <div className="mb-3 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                                <img src={message.image} alt="User upload" className="max-w-full h-auto object-contain max-h-64" />
                            </div>
                        )}

                        <div className={`prose prose-invert prose-sm max-w-none 
                            prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/5
                            prose-code:text-primary-light prose-code:bg-white/10 prose-code:px-1 prose-code:rounded
                            prose-strong:font-bold ${!isBot ? 'prose-p:text-white prose-strong:text-white' : ''}`}>
                            <ReactMarkdown 
                                remarkPlugins={remarkPlugins as any} 
                                rehypePlugins={rehypePlugins as any}
                            >
                                {message.text}
                            </ReactMarkdown>
                        </div>

                        {message.link && (
                            <Link 
                                to={message.link} 
                                className={`mt-4 flex items-center justify-between p-3 rounded-xl border transition-all group no-underline
                                    ${!isBot 
                                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                                        : 'bg-primary/10 border-primary/20 text-primary-light hover:bg-primary/20'}`}
                            >
                                <span className="font-bold text-xs uppercase tracking-widest">{message.linkText || "View Detail"}</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

import React, { useMemo, useRef, useEffect, useState } from 'react';
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

const sanitizeMermaid = (chart: string) => {
    // 0. Global String Detox: Nuke legacy ASCII Art separators from the entire block
    // We target 4+ chars to leave valid '---' (dash links) untouched if needed, 
    // but the AI usually hallucinates 10+ dashes for 'separators'.
    let cleanChart = chart
        .replace(/[-=_+]{4,}/g, '') // Remove long separators like "----------"
        .replace(/\+[-=]+\+/g, '')  // Remove ASCII box lids like "+---+"
        .replace(/\|[-= ]+\|/g, ''); // Remove ASCII box contents like "| --- |"

    let lines = cleanChart.split('\n');
    
    // 1. Remove remaining ASCII art lines and trailers
    lines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        // Strip lines that start with legacy ASCII box characters
        if (trimmed.startsWith('+---') || trimmed.startsWith('|--')) return false;
        return true;
    });

    // 2. Fix unclosed quotes and malformed arrow labels
    lines = lines.map(line => {
        let processed = line;
        
        // Fix the AI's common "|label|> B" mistake (Mermaid label bars shouldn't have a trailing >)
        processed = processed.replace(/\|([^|]+)\|>/g, '|$1|');
        
        // Parentheses Safe: Auto-quote labels containing parentheses |v0cos(θ)| -> |"v0cos(θ)"|
        // This prevents the parser from confusing (theta) with a node definition.
        processed = processed.replace(/\|([^|"]*(\([^)]*\)[^|"]*)+)\|/g, '|"$1"|');
        
        // Fix labels with quotes that got cut off
        const openQuoteCount = (processed.match(/"/g) || []).length;
        if (openQuoteCount % 2 !== 0 && processed.includes('["')) {
            processed = processed + '"';
        }

        // Ensure bracket is closed if it was an A[ ... ]
        if (processed.includes('[') && !processed.includes(']')) {
            processed = processed + ']';
        }
        
        // Final polish: fix malformed labeled arrows like "A -->|label|B" -> "A -->|label| B"
        processed = processed.replace(/(-->\|[^|]+\|)(\w)/g, '$1 $2');
        
        // Ensure node labels with spaces are quoted A[Some Text] -> A["Some Text"]
        processed = processed.replace(/\[\s*([^"\]\n]+?\s+[^"\]\n]+?)\s*\]/g, '["$1"]');
        
        return processed;
    });

    // 3. Ensure a header exists (default to graph TD if first non-empty line isn't a header)
    const firstContent = lines.find(l => l.trim().length > 0)?.trim() || "";
    
    // Critical: xychart-beta relies heavily on native brackets [x,y] for plotting arrays.
    if (firstContent.startsWith('xychart-beta')) {
        let safeChart = cleanChart;
        // Anti-Hallucination 1: Strip flow-chart 'notes'
        safeChart = safeChart.split('\n').filter(line => !line.toLowerCase().includes('note ')).join('\n');
        // Anti-Hallucination 2: Force newlines between core tags (AI sometimes collapses them)
        safeChart = safeChart.replace(/\s+(x-axis|y-axis|line|title)\s+/g, '\n$1 ');
        // Anti-Hallucination 3: The AI sometimes brackets its Y-axis or Title e.g. y-axis ["Text"]
        safeChart = safeChart.replace(/(y-axis|title)\s+\["?(.*?)"?\]/g, '$1 "$2"');
        // Anti-Hallucination 4: The AI sometimes completely hallucinates 2D arrays (e.g. line [[0, 0], [1, 2]])
        const match2D = safeChart.match(/line\s+(\[\[[\s\S]*?\]\])/);
        if (match2D) {
            try {
                // Safely parse the hallucinated 2D array matrix into JS native arrays
                const points = JSON.parse(match2D[1].replace(/'/g, '"'));
                if (Array.isArray(points) && points.length > 0 && Array.isArray(points[0])) {
                    const xCoords = points.map(p => p[0]);
                    const yCoords = points.map(p => p[1]);
                    // Delete any pre-existing broken x-axis lines to prevent duplicates
                    safeChart = safeChart.replace(/x-axis.*?(\n|$)/g, '');
                    // Re-inject the perfectly unwrapped separate flat arrays into the chart structure
                    safeChart = safeChart.replace(match2D[0], `x-axis [${xCoords.join(', ')}]\nline [${yCoords.join(', ')}]`);
                }
            } catch (e) {
                // If it fails to parse, we gracefully ignore and let the LLM fail natively.
            }
        }

        return safeChart;
    }
    
    const headers = ['graph', 'flowchart', 'sequenceDiagram', 'pie', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'journey', 'gitGraph', 'mindmap', 'timeline', 'xychart-beta'];
    const hasHeader = headers.some(h => firstContent.startsWith(h));
    
    if (!hasHeader && lines.length > 0) {
        lines.unshift('graph TD');
    }

    return lines.join('\n');
};

const Mermaid = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState(false);

    useEffect(() => {
        if (ref.current && chart) {
            const cleanChart = sanitizeMermaid(chart);
            import('mermaid').then(m => {
                const mermaid = m.default;
                mermaid.initialize({ 
                    startOnLoad: true, 
                    theme: 'dark',
                    securityLevel: 'loose',
                    fontFamily: 'Manrope',
                    themeVariables: {
                        primaryColor: '#5d21df',
                        primaryTextColor: '#fff',
                        primaryBorderColor: '#5d21df',
                        lineColor: '#5d21df',
                        secondaryColor: '#153ae4',
                        tertiaryColor: '#1d1f29'
                    }
                });
                mermaid.render(`mermaid-${Math.random().toString(36).substring(2, 9)}`, cleanChart).then(({ svg }) => {
                    if (svg.includes('mermaid-error') || svg.includes('Syntax error') || svg.includes('failed to render')) {
                        setRenderError(true);
                        return;
                    }
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                    }
                }).catch(() => {
                    console.warn("Mermaid dynamic render failed");
                    setRenderError(true);
                });
            });
        }
    }, [chart]);

    if (renderError) return null;

    return (
        <div className="my-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl overflow-x-auto no-scrollbar shadow-2xl backdrop-blur-xl">
            <div ref={ref} className="flex justify-center" />
        </div>
    );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
    const isBot = message.sender === 'bot';

    const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
    const rehypePlugins = useMemo(() => {
        const plugins: any[] = [];
        if (!message.isStreaming) {
            plugins.push(rehypeKatex);
            plugins.push(rehypeHighlight);
        }
        return plugins;
    }, [message.isStreaming]);

    const components = useMemo(() => ({
        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            
            if (!inline && lang === 'mermaid') {
                return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }
            
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }
    }), []);

    return (
        <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex items-end max-w-[92%] md:max-w-[70%] gap-1.5 md:gap-2 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 hover:scale-110 relative mb-1
                    ${isBot ? 'bg-gradient-to-br from-[#5d21df] to-[#153ae4]' : 'bg-[#cdbdff]'}`}>
                    {isBot ? (
                        <>
                            <Bot size={14} className="text-white relative z-10" />
                            <div className="absolute inset-x-[-2px] inset-y-[-2px] bg-indigo-500/20 rounded-full animate-pulse blur-sm" />
                        </>
                    ) : (
                        <User size={14} className="text-[#11131c]" />
                    )}
                </div>

                {/* Message Content Container */}
                <div className="flex flex-col min-w-0">
                    <div className={`relative px-4 pt-3 pb-2 text-[14px] w-fit leading-relaxed shadow-lg transition-all duration-300 font-manrope
                        ${isBot 
                            ? 'bg-[#32343e]/80 backdrop-blur-md border border-white/5 text-gray-100 rounded-2xl rounded-bl-sm pr-14' 
                            : 'bg-gradient-to-br from-[#5d21df] to-[#4318c4] text-white rounded-2xl rounded-br-sm shadow-indigo-500/20 pr-16'}
                        ${!message.text && !message.image ? 'hidden' : ''}`}>
                        
                        {message.image && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                                <img src={message.image} alt="User upload" className="max-w-full h-auto object-contain max-h-64" />
                            </div>
                        )}

                        <div className={`prose prose-invert prose-xs max-w-none 
                            prose-p:my-0 prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:border-none prose-pre:p-0
                            prose-code:text-[#cdbdff]/90 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded
                            prose-strong:font-black ${!isBot ? 'prose-p:text-white prose-strong:text-white prose-headings:text-white' : ''}`}>
                            <ReactMarkdown 
                                remarkPlugins={remarkPlugins as any} 
                                rehypePlugins={rehypePlugins as any}
                                components={components as any}
                            >
                                {message.text}
                            </ReactMarkdown>
                        </div>

                        {message.link && (
                            <Link 
                                to={message.link} 
                                className={`mt-3 flex items-center justify-between p-2 rounded-lg border transition-all group no-underline
                                    ${!isBot 
                                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                                        : 'bg-white/5 border-white/10 text-[#cdbdff] hover:bg-white/10'}`}
                            >
                                <span className="font-bold text-[10px] uppercase tracking-widest">{message.linkText || "View Detail"}</span>
                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                        
                        {/* Timestamp - Refined Positioning */}
                        <div className="absolute bottom-1.5 right-2.5 leading-none">
                            <span className={`text-[9px] font-bold tabular-nums uppercase tracking-tight ${isBot ? 'text-white/20' : 'text-white/40'}`}>
                                {new Date(message.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

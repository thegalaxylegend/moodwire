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
import { usePerformanceLevel } from '../../hooks/usePerformanceLevel';

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
        .replace(/(?<!-)[-=_+]{4,}(?!>)/g, '') // Remove long separators ONLY if not part of an arrow (-->)
        .replace(/\+[-=]+\+/g, '')  // Remove ASCII box lids like "+---+"
        .replace(/\|[-= ]+\|/g, ''); // Remove ASCII box contents like "| --- |"

    let lines = cleanChart.split('\n');
    
    // 1. Remove remaining ASCII art lines, trailers, and accidental bullets
    lines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        // Strip lines that start with legacy ASCII box characters
        if (trimmed.startsWith('+---') || trimmed.startsWith('|--')) return false;
        return true;
    }).map(line => {
        // Strip leading bullets (•, -, *) mistakenly added by LLM
        return line.trim().replace(/^[•\-\*]\s+/, '');
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
        
        // 🚨 SYNTAX BOMB DETECTOR: Nuke hallucinated terminators like ";]}", "]]]", or "}}"
        // The AI often gets confused and piles up closing brackets or mix-and-matches JS syntax.
        processed = processed.replace(/[\}\]\)\;]{3,}(\s|$)/g, '$1'); // Nuke 3+ piles
        processed = processed.replace(/[\}\;\]]{2,}(\s|$)/g, ']'); // Convert hybrid garbage to a single bracket
        
        return processed;
    });

    lines = lines.map(line => {
        let l = line;
        
        // Auto-close unclosed node brackets [ ( {
        const counts = { '[': 0, ']': 0, '(': 0, ')': 0, '{': 0, '}': 0 };
        for (let char of l) { 
            if (counts.hasOwnProperty(char)) counts[char as keyof typeof counts]++; 
            else if (char === ']' && counts['['] > 0) counts['[']--;
            else if (char === ')' && counts['('] > 0) counts['(']--;
            else if (char === '}' && counts['{'] > 0) counts['{']--;
        }
        if (counts['['] > 0) l += ']'.repeat(counts['[']);
        if (counts['('] > 0) l += ')'.repeat(counts['(']);
        if (counts['{'] > 0) l += '}'.repeat(counts['{']);

        // Fix unquoted labels containing special chars, spaces, or non-ASCII (Hinglish/Unicode)
        // We use a broader range for non-ASCII to support Devanagari (Hindi)
        l = l.replace(/([\w\u0900-\u097F]+)\s*\[\s*([^"\]\n]*?[^\w\-\.\,][^"\]\n]*?)\s*\]/g, '$1["$2"]');
        l = l.replace(/([\w\u0900-\u097F]+)\s*\(\s*([^"\]\n]*?[^\w\-\.\,][^"\]\n]*?)\s*\)/g, '$1("$2")');
        l = l.replace(/([\w\u0900-\u097F]+)\s*\{\s*([^"\}\n]*?[^\w\-\.\,][^"\}\n]*?)\s*\}\}/g, '$1{{"$2"}}');

        return l;
    });

    // 4. Ensure a header exists (default to graph TD if first non-empty line isn't a header)
    const firstContentLine = lines.find(l => l.trim().length > 0)?.trim() || "";
    
    // Critical: xychart-beta relies heavily on native brackets [x,y] for plotting arrays.
    if (firstContentLine.startsWith('xychart-beta')) {
        let safeChart = cleanChart;
        // Anti-Hallucination: Strip flow-chart junk and force spacing
        safeChart = safeChart.split('\n').filter(line => !line.toLowerCase().includes('note ')).join('\n');
        safeChart = safeChart.replace(/\s+(x-axis|y-axis|line|title)\s+/g, '\n$1 ');
        safeChart = safeChart.replace(/(y-axis|title)\s+\["?(.*?)"?\]/g, '$1 "$2"');
        
        // Anti-Hallucination: Unwrap 2D arrays line [[0,0],[1,1]] -> x-axis [0,1] line [0,1]
        const match2D = safeChart.match(/line\s+(\[\[[\s\S]*?\]\])/);
        if (match2D) {
            try {
                const points = JSON.parse(match2D[1].replace(/'/g, '"'));
                if (Array.isArray(points) && points.length > 0 && Array.isArray(points[0])) {
                    const xCoords = points.map(p => p[0]);
                    const yCoords = points.map(p => p[1]);
                    safeChart = safeChart.replace(/x-axis.*?(\n|$)/g, '');
                    safeChart = safeChart.replace(match2D[0], `x-axis [${xCoords.join(', ')}]\nline [${yCoords.join(', ')}]`);
                }
            } catch (e) {}
        }
        return safeChart;
    }
    
    const headers = ['graph', 'flowchart', 'sequenceDiagram', 'pie', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'journey', 'gitGraph', 'mindmap', 'timeline', 'xychart-beta'];
    const hasHeader = headers.some(h => firstContentLine.toLowerCase().startsWith(h.toLowerCase()));
    
    if (!hasHeader && lines.length > 0) {
        lines.unshift('graph TD');
    }

    return lines.join('\n');
};

const Mermaid = ({ chart, isStreaming }: { chart: string; isStreaming?: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (ref.current && chart && !isStreaming) {
            const cleanChart = sanitizeMermaid(chart);
            import('mermaid').then(m => {
                const mermaid = m.default;
                mermaid.initialize({ 
                    startOnLoad: true, 
                    theme: 'dark',
                    securityLevel: 'loose',
                    htmlLabels: true, // Crucial for Unicode/Hinglish rendering
                    fontFamily: 'Manrope',
                    suppressErrorRendering: true, // Hide default Mermaid error UI
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
                    // SILENT FAILURE: Catch version-specific error markers and syntax bombs
                    const lowerSvg = svg.toLowerCase();
                    if (lowerSvg.includes('mermaid-error') || 
                        lowerSvg.includes('syntax error') || 
                        lowerSvg.includes('error-icon') || 
                        lowerSvg.includes('failed to render') ||
                        lowerSvg.includes('error-text') || 
                        lowerSvg.includes('class="error"') ||
                        lowerSvg.includes('bomb')) {
                        setRenderError(true);
                        if (ref.current) ref.current.innerHTML = '';
                        return;
                    }
                    if (isMounted && ref.current) {
                        ref.current.innerHTML = svg;
                    }
                }).catch((err) => {
                    if (isMounted) {
                        console.warn("Mermaid dynamic render failed:", err);
                        setRenderError(true);
                        if (ref.current) ref.current.innerHTML = '';
                    }
                });
            });
        }
        return () => { isMounted = false; };
    }, [chart, isStreaming]);

    if (renderError || !chart) return null;

    if (isStreaming) {
        return (
            <div className="my-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl flex flex-col items-center justify-center min-h-[120px] animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-[#5d21df]/30 border-t-[#5d21df] animate-spin mb-3" />
                <span className="text-xs text-white/40 font-medium">Visualizing flow...</span>
            </div>
        );
    }

    return (
        <div className="my-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl overflow-x-auto no-scrollbar shadow-2xl backdrop-blur-xl">
            <div ref={ref} className="flex justify-center" />
        </div>
    );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
    const perfTier = usePerformanceLevel();
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
                return <Mermaid chart={String(children).replace(/\n$/, '')} isStreaming={message.isStreaming} />;
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
                            {perfTier !== 'low' && (
                                <div className="absolute inset-x-[-2px] inset-y-[-2px] bg-indigo-500/20 rounded-full animate-pulse blur-sm" />
                            )}
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

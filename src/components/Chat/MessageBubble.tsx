import React, { useMemo, useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { Bot, User, ArrowRight, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePerformance } from '../../context/PerformanceProvider';
import mermaid from 'mermaid';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    link?: string;
    linkText?: string;
    image?: string;
    isStreaming?: boolean;
    language?: 'en' | 'hi' | 'hinglish';
}

interface MessageBubbleProps {
    message: Message;
    onSpeak?: (text: string, id: number, language?: 'en' | 'hi' | 'hinglish') => void;
    speakingId?: number | null;
}

const sanitizeMermaid = (chart: string) => {
    // 0. Global String Detox: Nuke legacy ASCII Art separators from the entire block
    // We target 4+ chars to leave valid '---' (dash links) untouched if needed, 
    // but the AI usually hallucinates 10+ dashes for 'separators'.
    const cleanChart = chart
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
        return line.trim().replace(/^[•\-*]\s+/, '');
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
        processed = processed.replace(/[{}()\;]{3,}(\s|$)/g, '$1'); // Nuke 3+ piles
        processed = processed.replace(/[{;\]]{2,}(\s|$)/g, ']'); // Convert hybrid garbage to a single bracket
        
        return processed;
    });

    lines = lines.map(line => {
        let l = line;
        const counts = { '[': 0, '(': 0, '{': 0 };
        for (const char of l) {
            if (char === '[') counts['[']++;
            else if (char === ']' && counts['['] > 0) counts['[']--;
            else if (char === '(') counts['(']++;
            else if (char === ')' && counts['('] > 0) counts['(']--;
            else if (char === '{') counts['{']++;
            else if (char === '}' && counts['{'] > 0) counts['{']--;
        }
        if (counts['['] > 0) l += ']'.repeat(counts['[']);
        if (counts['('] > 0) l += ')'.repeat(counts['(']);
        if (counts['{'] > 0) l += '}'.repeat(counts['{']);

        // Fix unquoted labels containing special chars, spaces, or non-ASCII (Hinglish/Unicode)
        // We use a broader range for non-ASCII to support Devanagari (Hindi)
        l = l.replace(/(\w|[\u0900-\u097F]+)\s*\[\s*([^"\]\n]*?[^\w\-.\,][^"\]\n]*?)\s*\]/g, '$1["$2"]');
        l = l.replace(/(\w|[\u0900-\u097F]+)\s*\(\s*([^"\]\n]*?[^\w\-.\,][^"\]\n]*?)\s*\)/g, '$1("$2")');
        l = l.replace(/(\w|[\u0900-\u097F]+)\s*\{\s*([^"\}\n]*?[^\w\-.\,][^"\}\n]*?)\s*\}\}/g, '$1{{"$2"}}');

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
            } catch (_e) {}
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
            try {
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
                    if (isMounted && ref.current) {
                        ref.current.innerHTML = svg;
                    }
                }).catch((err) => {
                    if (isMounted) {
                        console.warn("Mermaid dynamic render failed:", err);
                        if (ref.current) ref.current.innerHTML = '';
                    }
                });
            } catch (err) {
                console.warn("Mermaid initialization failed:", err);
                // Schedule state update to avoid direct setState-in-catch inside effect
                if (isMounted) {
                    Promise.resolve().then(() => { if (isMounted) setRenderError(true); });
                }
            }
        }
        return () => { isMounted = false; };
    }, [chart, isStreaming]);

    if (renderError || !chart) return null;

    if (isStreaming) {
        return (
            <div className="my-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl flex flex-col items-center justify-center min-h-[120px] animate-pulse">
                <div className="size-12 rounded-full border-2 border-[#5d21df]/30 border-t-[#5d21df] animate-spin mb-3" />
                <span className="text-xs text-white/40 font-medium">Visualizing flow…</span>
            </div>
        );
    }

    return (
        <div className="my-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl overflow-x-auto no-scrollbar shadow-2xl backdrop-blur-xl">
            <div ref={ref} className="flex justify-center" />
        </div>
    );
};

/**
 * StreamingMessage — renders the bot message with a premium blur-reveal
 * materialization effect. It uses a single ReactMarkdown component to preserve
 * standard HTML layout and markdown parsing, while recursively wrapping
 * newly streamed characters in a soft blur-fade span.
 */
type ReactMarkdownPlugin = Parameters<typeof ReactMarkdown>[0]['remarkPlugins'];
type ReactMarkdownComponents = NonNullable<Parameters<typeof ReactMarkdown>[0]['components']>;

const StreamingMessage = React.memo(({ text, remarkPlugins, rehypePlugins, components }: {
    text: string;
    remarkPlugins: ReactMarkdownPlugin;
    rehypePlugins: ReactMarkdownPlugin;
    components: ReactMarkdownComponents;
}) => {
    const { tier: perfTier } = usePerformance();
    const prevTextRef = useRef('');
    const [stableLength, setStableLength] = useState(0);

    useEffect(() => {
        setStableLength(prevTextRef.current.length);
        prevTextRef.current = text;
    }, [text]);

    const charIndexRef = useRef(0);

    // Recursively walk the React children to wrap new text in animated spans
    const wrapChildren = (children: React.ReactNode): React.ReactNode => {
        if (children === null || children === undefined) {
            return children;
        }

        if (typeof children === 'string' || typeof children === 'number') {
            const str = String(children);
            const len = str.length;
            const startIdx = charIndexRef.current;
            charIndexRef.current += len;

            // If the entire string is already stable, render as plain text node
            if (startIdx + len <= stableLength) {
                return str;
            }

            // GPU & DOM Optimization: On low-end or balanced devices, do NOT create individual spans 
            // per character. Instead, wrap the newly-appended block in a single lightweight 'exa-chunk-reveal' span.
            // This eliminates thousands of DOM nodes and avoids hanging the rendering engine.
            if (perfTier === 'low' || perfTier === 'balanced') {
                if (startIdx >= stableLength) {
                    return (
                        <span key={startIdx} className="exa-chunk-reveal">
                            {str}
                        </span>
                    );
                } else {
                    const stablePart = str.slice(0, stableLength - startIdx);
                    const newPart = str.slice(stableLength - startIdx);
                    return (
                        <React.Fragment key={startIdx}>
                            {stablePart}
                            <span className="exa-chunk-reveal">
                                {newPart}
                            </span>
                        </React.Fragment>
                    );
                }
            }

            // Split and wrap only the characters in the active animation window
            const elements: React.ReactNode[] = [];
            for (let i = 0; i < len; i++) {
                const globalIdx = startIdx + i;
                const char = str[i];

                if (globalIdx < stableLength) {
                    elements.push(char);
                } else {
                    const delayMs = (globalIdx - stableLength) * 8; // Ultra smooth 8ms stagger
                    elements.push(
                        <span
                            key={globalIdx}
                            className="exa-char-reveal"
                            style={{
                                animationDelay: `${delayMs}ms`,
                            }}
                        >
                            {char}
                        </span>
                    );
                }
            }
            return elements;
        }

        if (Array.isArray(children)) {
            return children.map((child, index) => {
                if (child === null || child === undefined) return null;
                return (
                    <React.Fragment key={index}>
                        {wrapChildren(child)}
                    </React.Fragment>
                );
            });
        }

        if (React.isValidElement(children)) {
            const element = children as React.ReactElement<any>;
            if (element.props && element.props.children !== undefined) {
                return React.cloneElement(element, {
                    ...element.props,
                    children: wrapChildren(element.props.children),
                });
            }
            return element;
        }

        return children;
    };

    // Override elements to inject the character wrapper
    const animatedComponents = useMemo<any>(() => {
        const override = (Tag: any) => {
            const TagComponent = Tag;
            return ({ children, _node, ...props }: any) => {
                // eslint-disable-next-line react-hooks/refs -- charIndexRef is intentionally read during render as a stateless counter
                return <TagComponent {...props}>{wrapChildren(children)}</TagComponent>;
            };
        };

        return {
            ...components,
            p: override('p'),
            span: override('span'),
            strong: override('strong'),
            em: override('em'),
            a: override('a'),
            li: override('li'),
            h1: override('h1'),
            h2: override('h2'),
            h3: override('h3'),
            h4: override('h4'),
            h5: override('h5'),
            h6: override('h6'),
            td: override('td'),
            th: override('th'),
            code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : '';
                
                if (!inline && lang === 'mermaid') {
                    // Do NOT wrap children of Mermaid diagrams!
                    if (components.code) {
                        const CodeComponent = components.code as any;
                        return <CodeComponent node={node} inline={inline} className={className} {...props}>{children}</CodeComponent>;
                    }
                    return <Mermaid chart={String(children).replace(/\n$/, '')} isStreaming={true} />;
                }

                // For normal code blocks, wrap children to let code stream beautifully
                if (components.code) {
                    const CodeComponent = components.code as any;
                    const rendered = <CodeComponent node={node} inline={inline} className={className} {...props}>{children}</CodeComponent>;
                    if (React.isValidElement(rendered)) {
                        const el = rendered as React.ReactElement<any>;
                        return React.cloneElement(el, {
                            ...el.props,
                            children: wrapChildren(el.props.children)
                        });
                    }
                    return rendered;
                }
                return <code className={className} {...props}>{wrapChildren(children)}</code>;
            }
        };
    }, [components, stableLength]);

    // Reset character counter before rendering the ReactMarkdown tree
    charIndexRef.current = 0;

    return (
        <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={animatedComponents}
        >
            {text}
        </ReactMarkdown>
    );
});


export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, onSpeak, speakingId }) => {
    const { tier: perfTier } = usePerformance();
    const isBot = message.sender === 'bot';

    const remarkPlugins = useMemo(() => [remarkGfm, remarkMath], []);
    const rehypePlugins = useMemo((): ReactMarkdownPlugin => {
        const plugins: ReactMarkdownPlugin = [];
        if (!message.isStreaming) {
            (plugins as Parameters<typeof ReactMarkdown>[0]['remarkPlugins'][])?.push(rehypeKatex as never);
            (plugins as Parameters<typeof ReactMarkdown>[0]['remarkPlugins'][])?.push(rehypeHighlight as never);
        }
        return plugins;
    }, [message.isStreaming]);

    const components = useMemo(() => ({
        code({ node: _node, inline, className, children, ...props }: { node?: unknown; inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: unknown }) {
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
    }), [message.isStreaming]);

    return (
        <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
            <div className={`flex items-end max-w-[92%] md:max-w-[75%] gap-2.5 md:gap-3.5 relative group/bubble ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 hover:scale-110 relative mb-1
                    ${isBot ? 'bg-gradient-to-br from-[#5d21df] to-[#153ae4]' : 'bg-[#cdbdff]'}`}>
                    {isBot ? (
                        <>
                            <Bot size={15} className="text-white relative z-10" />
                            {perfTier !== 'low' && (
                                <div className="absolute inset-x-[-2px] inset-y-[-2px] bg-indigo-500/20 rounded-full animate-pulse blur-sm" />
                            )}
                        </>
                    ) : (
                        <User size={15} className="text-[#11131c]" />
                    )}
                </div>

                {/* Message Content Container */}
                <div className="flex flex-col min-w-0">
                    <div className="flex items-end gap-2 md:gap-3">
                        <div className={`relative px-4 pt-3 pb-2 text-[14px] w-fit leading-relaxed shadow-lg transition-all duration-300 font-manrope
                            ${isBot 
                                ? 'bg-[#32343e]/80 backdrop-blur-md border border-white/5 text-gray-100 rounded-2xl rounded-bl-sm' 
                                : 'bg-gradient-to-br from-[#5d21df] to-[#4318c4] text-white rounded-2xl rounded-br-sm shadow-indigo-500/20'}
                            ${!message.text && !message.image ? 'hidden' : ''}`}>
                            
                            {message.image && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                                    <img src={message.image} alt="User upload" className="max-w-full h-auto object-contain max-h-64" />
                                </div>
                            )}

                            <div className={`prose prose-invert prose-xs max-w-none 
                                prose-p:my-0 prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:border-none prose-pre:p-0
                                prose-code:text-[#cdbdff]/90 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded
                                prose-strong:font-black ${!isBot ? 'prose-p:text-white prose-strong:text-white prose-headings:text-white' : ''}
                                ${message.isStreaming && isBot ? 'is-streaming' : ''}`}>
                                {message.isStreaming && isBot ? (
                                    <StreamingMessage
                                        text={message.text}
                                        remarkPlugins={remarkPlugins as any}
                                        rehypePlugins={rehypePlugins as any}
                                        components={components as any}
                                    />
                                ) : (
                                    <ReactMarkdown 
                                        remarkPlugins={remarkPlugins as any} 
                                        rehypePlugins={rehypePlugins as any}
                                        components={components as any}
                                    >
                                        {message.text}
                                    </ReactMarkdown>
                                )}
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
                        </div>

                        {/* Speaking Button on the Right Side */}
                        {isBot && onSpeak && !message.isStreaming && (
                            <div className="flex-shrink-0 mb-1">
                                <button type="button" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSpeak(message.text, message.id, message.language);
                                    }}
                                    className={`size-7 md:size-8 rounded-full flex items-center justify-center transition-all duration-500 border relative group/speak
                                        ${speakingId === message.id 
                                            ? 'bg-gradient-to-br from-[#5d21df] to-[#153ae4] border-transparent text-white shadow-[0_0_15px_rgba(93,33,223,0.5)] scale-105' 
                                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:border-[#5d21df]/40 hover:bg-white/[0.06] hover:scale-110'
                                        }`}
                                    title={speakingId === message.id ? "Stop Reading" : "Read Aloud"}
                                >
                                    {speakingId === message.id ? (
                                        <div className="flex gap-0.5 items-center justify-center h-2.5 relative z-10">
                                            <span className="w-0.5 h-2 bg-white rounded-full animate-wave-1" />
                                            <span className="w-0.5 h-1.5 bg-white rounded-full animate-wave-2 [animation-delay:-0.2s]" />
                                            <span className="w-0.5 h-2.5 bg-white rounded-full animate-wave-3 [animation-delay:-0.4s]" />
                                            <span className="w-0.5 h-1 bg-white rounded-full animate-wave-1 [animation-delay:-0.1s]" />
                                        </div>
                                    ) : (
                                        <Volume2 size={13} className="transition-transform group-hover/speak:rotate-12 duration-300 relative z-10 md:size-[14px]" />
                                    )}
                                    
                                    {/* Inner animated halo ring */}
                                    {speakingId === message.id && perfTier !== 'low' && (
                                        <div className="absolute inset-x-[-3px] inset-y-[-3px] border border-indigo-400/40 rounded-full animate-ping opacity-60 pointer-events-none" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Meta Row: Timestamp Only */}
                    <div className={`flex items-center gap-1.5 mt-1 ${isBot ? 'self-start' : 'self-end flex-row-reverse'}`}>
                        <span className={`text-[9px] font-bold tabular-nums uppercase tracking-tight ${isBot ? 'text-white/20' : 'text-white/40'}`}>
                            {new Date(message.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

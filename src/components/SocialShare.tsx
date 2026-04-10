
import React from 'react';
import { Share2, Send, MessageCircle, Copy, Check, Twitter } from 'lucide-react';

interface SocialShareProps {
    title: string;
    url?: string;
    orientation?: 'horizontal' | 'vertical';
}

export const SocialShare: React.FC<SocialShareProps> = ({ 
    title, 
    url: providedUrl,
    orientation = 'horizontal' 
}) => {
    const isServer = typeof window === 'undefined';
    const url = providedUrl || (!isServer ? window.location.href : '');
    const [copied, setCopied] = React.useState(false);

    const shareData = {
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} - ${url}`)}`
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const containerClasses = orientation === 'horizontal' 
        ? "flex flex-wrap items-center gap-2 sm:gap-3" 
        : "flex flex-col items-center gap-4 py-6";

    // Standard button class for identical sizing across all platforms
    const btnBase = "w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all border shrink-0";
    const iconSize = "w-5 h-5 sm:w-6 sm:h-6";

    return (
        <div className={containerClasses}>
            {/* WhatsApp */}
            <a 
                href={shareData.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${btnBase} bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20`}
                title="Share on WhatsApp"
            >
                <MessageCircle className={iconSize} />
            </a>
            
            {/* Telegram */}
            <a 
                href={shareData.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${btnBase} bg-[#0088cc]/10 text-[#0088cc] border-[#0088cc]/20 hover:bg-[#0088cc]/20`}
                title="Share on Telegram"
            >
                <Send className={iconSize} />
            </a>

            {/* X (Twitter) */}
            <a 
                href={shareData.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${btnBase} bg-white/5 text-white border-white/10 hover:bg-white/10`}
                title="Share on X"
            >
                <Twitter className={iconSize} />
            </a>

            {/* Threads */}
            <a 
                href={shareData.threads} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${btnBase} bg-white/5 text-white border-white/10 hover:bg-white/10`}
                title="Share on Threads"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconSize}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
            </a>

            {/* Copy Link */}
            <button 
                onClick={copyToClipboard}
                className={`${btnBase} ${
                    copied 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                }`}
                title="Copy Link"
            >
                {copied ? <Check className={iconSize} /> : <Copy className={iconSize} />}
            </button>
            
            {orientation === 'horizontal' && (
                <div className="hidden xs:flex items-center gap-2 ml-1 text-gray-500">
                    <Share2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Share</span>
                </div>
            )}
        </div>
    );
};



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

    return (
        <div className={containerClasses}>
            <a 
                href={shareData.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 shrink-0"
                title="Share on WhatsApp"
            >
                <MessageCircle className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </a>
            
            <a 
                href={shareData.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 bg-[#0088cc]/10 text-[#0088cc] rounded-xl hover:bg-[#0088cc]/20 transition-all border border-[#0088cc]/20 shrink-0"
                title="Share on Telegram"
            >
                <Send className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </a>

            <a 
                href={shareData.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all border border-white/10 shrink-0"
                title="Share on X"
            >
                <Twitter className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </a>

            <a 
                href={shareData.threads} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all border border-white/10 shrink-0"
                title="Share on Threads"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] sm:w-5 sm:h-5"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
            </a>

            <button 
                onClick={copyToClipboard}
                className={`p-2 sm:p-2.5 rounded-xl transition-all border flex items-center justify-center shrink-0 ${
                    copied 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                }`}
                title="Copy Link"
            >
                {copied ? <Check className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> : <Copy className="w-[18px] h-[18px] sm:w-5 sm:h-5" />}
            </button>
            
            {orientation === 'horizontal' && (
                <span className="hidden xs:flex text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 sm:ml-2 items-center gap-1 sm:gap-2">
                    <Share2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Viral</span> Share
                </span>
            )}
        </div>
    );
};


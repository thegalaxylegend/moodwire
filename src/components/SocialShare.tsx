
import React from 'react';
import { Share2, Send, MessageCircle, Copy, Check } from 'lucide-react';

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
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const containerClasses = orientation === 'horizontal' 
        ? "flex items-center gap-3" 
        : "flex flex-col items-center gap-4 py-6";

    return (
        <div className={containerClasses}>
            <a 
                href={shareData.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
                title="Share on WhatsApp"
            >
                <MessageCircle size={20} />
            </a>
            
            <a 
                href={shareData.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-[#0088cc]/10 text-[#0088cc] rounded-xl hover:bg-[#0088cc]/20 transition-colors border border-[#0088cc]/20"
                title="Share on Telegram"
            >
                <Send size={20} />
            </a>

            <button 
                onClick={copyToClipboard}
                className={`p-2.5 rounded-xl transition-all border flex items-center justify-center ${
                    copied 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                }`}
                title="Copy Link"
            >
                {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
            
            {orientation === 'horizontal' && (
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Share2 size={14} />
                    Viral Share
                </span>
            )}
        </div>
    );
};

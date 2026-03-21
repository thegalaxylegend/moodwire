import React from 'react';

interface MinimizedBubbleProps {
    isHolding: boolean;
    isSpeaking: boolean;
    isThinking: boolean;
    onMaximize: () => void;
    onPTTStart: (e: any) => void;
    onPTTEnd: (e: any) => void;
    isCallActive?: boolean;
}

export const MinimizedBubble: React.FC<MinimizedBubbleProps> = ({
    isHolding,
    isSpeaking,
    isThinking,
    onMaximize,
    onPTTStart,
    onPTTEnd,
    isCallActive = false
}) => {
    return (
        <div
            className={`relative cursor-pointer transition-all duration-500 ease-out 
                ${isHolding ? 'scale-90' : 'hover:scale-110 active:scale-95'} 
                select-none touch-none group`}
            onClick={(e) => {
                e.preventDefault();
                onMaximize();
            }}
            onMouseDown={onPTTStart}
            onMouseUp={onPTTEnd}
            onMouseLeave={onPTTEnd}
            onTouchStart={(e) => onPTTStart(e)}
            onTouchEnd={(e) => onPTTEnd(e)}
        >
            {/* Status Ripples */}
            {(isSpeaking || isThinking || isHolding || isCallActive) && (
                <div className="absolute inset-0 z-0">
                    <div className={`absolute inset-0 rounded-full animate-ping [animation-duration:2s] ${isCallActive ? 'bg-indigo-500/40' : 'bg-primary/40'}`} />
                    <div className={`absolute inset-0 rounded-full animate-ping [animation-duration:3s] [animation-delay:0.5s] ${isCallActive ? 'bg-indigo-500/20' : 'bg-primary/20'}`} />
                    {(isSpeaking || isCallActive) && <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-pulse blur-xl" />}
                </div>
            )}

            {/* Main Bubble Circle */}
            <div className="relative z-10">
                {/* Glassmorphism Ring */}
                <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500`} />
                
                {/* Avatar Container */}
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#0d0f14] border-2 transition-all duration-300 relative overflow-hidden flex items-center justify-center
                    ${isCallActive ? 'border-indigo-400 shadow-[0_0_40px_rgba(79,70,229,0.5)] scale-110' : 'shadow-[0_0_30px_rgba(79,70,229,0.3)]'}
                    ${isSpeaking ? 'border-indigo-400' : 'border-white/10 group-hover:border-primary/50'}`}>
                    
                    <img
                        src="/logo.jpg"
                        alt="Chat"
                        className={`w-[120%] h-[120%] object-cover transition-all duration-500 scale-110 select-none
                            ${isSpeaking ? 'animate-pulse contrast-125' : 'grayscale-[20%] group-hover:grayscale-0'}`}
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
                        }}
                    />

                    {/* Active Indicators */}
                    {isThinking && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Notification Badge if needed, or Online status */}
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0d0f14] shadow-lg shadow-green-500/20" />
            </div>
        </div>
    );
};

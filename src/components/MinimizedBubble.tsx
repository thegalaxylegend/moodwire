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
                <div className="absolute inset-[-8px] z-0 pointer-events-none">
                    <div className={`absolute inset-0 rounded-full animate-ping [animation-duration:3s] ${isCallActive ? 'bg-[#81ecff]/30' : 'bg-[#5d21df]/30'}`} />
                    <div className={`absolute inset-0 rounded-full animate-ping [animation-duration:4s] [animation-delay:0.5s] ${isCallActive ? 'bg-[#81ecff]/10' : 'bg-[#5d21df]/10'}`} />
                    {(isSpeaking || isCallActive) && <div className="absolute inset-2 bg-[#5d21df]/40 rounded-full animate-pulse blur-xl" />}
                </div>
            )}

            {/* Main Bubble Circle */}
            <div className="relative z-10">
                {/* Glassmorphism Ring */}
                <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500`} />
                
                {/* Avatar Container */}
                <div className={`w-20 h-20 md:w-20 md:h-20 rounded-[32px] bg-gradient-to-br from-[#11131c] to-[#1d1f29] border-2 transition-all duration-500 relative overflow-hidden flex items-center justify-center rotate-3 group-hover:rotate-0
                    ${isCallActive ? 'border-[#81ecff] shadow-[0_0_50px_rgba(129,236,255,0.4)] scale-110' : 'border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] shadow-[#5d21df]/10 group-hover:shadow-[#5d21df]/20'}
                    ${isSpeaking ? 'border-[#5d21df]' : 'group-hover:border-[#5d21df]/50'}`}>
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5d21df]/20 to-[#153ae4]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <img 
                        src="/logo.png" 
                        alt="Exa AI" 
                        className={`w-full h-full transition-all duration-500 relative z-10 object-cover
                            ${isSpeaking ? 'animate-pulse scale-105' : 'opacity-100 group-hover:scale-110'}`} 
                    />

                    {/* Active Indicators */}
                    {isThinking && (
                        <div className="absolute inset-0 bg-[#11131c]/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <div className="flex gap-1.5">
                                <span className="size-1.5 bg-[#81ecff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="size-1.5 bg-[#81ecff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="size-1.5 bg-[#81ecff] rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Online status indicator */}
                <div className="absolute top-1 right-1 size-4 bg-[#81ecff] rounded-full border-[3px] border-[#11131c] shadow-[0_0_15px_#81ecff] z-30" />
            </div>
        </div>
    );
};

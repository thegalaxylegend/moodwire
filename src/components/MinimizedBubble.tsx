import React from 'react';

interface MinimizedBubbleProps {
    isHolding: boolean;
    isSpeaking: boolean;
    isThinking: boolean;
    onMaximize: () => void;
    onPTTStart: (e: any) => void;
    onPTTEnd: (e: any) => void;
}

export const MinimizedBubble: React.FC<MinimizedBubbleProps> = ({
    isHolding,
    isSpeaking,
    isThinking,
    onMaximize,
    onPTTStart,
    onPTTEnd
}) => {
    return (
        <div
            className={`relative cursor-pointer transition-transform duration-300 ${isHolding ? 'scale-90' : 'hover:scale-105'} select-none touch-none`}
            onClick={(e) => {
                e.preventDefault();
                onMaximize();
            }}
            onMouseDown={onPTTStart}
            onMouseUp={onPTTEnd}
            onMouseLeave={onPTTEnd}
            onTouchStart={(e) => {
                // e.preventDefault(); // Handled in startListening but added here for safety
                onPTTStart(e);
            }}
            onTouchEnd={(e) => {
                // e.preventDefault(); 
                onPTTEnd(e);
            }}
        >
            {/* Main Bubble Circle */}
            <div className="relative">
                {/* Status Glow Ring */}
                <div className={`absolute -inset-0.5 rounded-full bg-primary blur-sm transition-all duration-300 ${isSpeaking ? 'opacity-100 scale-125' : 'opacity-40 scale-100'} ${isThinking ? 'animate-pulse' : ''}`} />

                {/* Avatar Container */}
                <div className="w-16 h-16 rounded-full bg-surface border-2 border-primary relative z-10 overflow-hidden shadow-2xl flex items-center justify-center">
                    <img
                        src="https://firebasestorage.googleapis.com/v0/b/legendstech001.appspot.com/o/astronaut.png?alt=media"
                        alt="Exa"
                        className="w-full h-full object-cover scale-110 select-none"
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/exa-logo.png";
                        }}
                    />

                </div>
            </div>
        </div>
    );
};

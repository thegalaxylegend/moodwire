import React, { useRef } from 'react';
import { Send, Mic, Paperclip, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface InputBarProps {
    input: string;
    setInput: (val: string) => void;
    handleSend: (e: React.FormEvent) => void;
    isThinking: boolean;
    isListening: boolean;
    selectedImage: string | null;
    setSelectedImage: (val: string | null) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPTTStart: (e: any) => void;
    onPTTEnd: (e: any) => void;
}

export const InputBar: React.FC<InputBarProps> = ({
    input,
    setInput,
    handleSend,
    isThinking,
    isListening,
    selectedImage,
    setSelectedImage,
    handleFileSelect,
    onPTTStart,
    onPTTEnd
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="w-full">
            {selectedImage && (
                <div className="mb-4 relative inline-block group animate-in zoom-in-95 duration-200">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="h-20 w-20 object-cover rounded-2xl border border-white/20 shadow-2xl relative z-10" 
                    />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-xl hover:bg-red-600 transition-all hover:scale-110 z-20"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                </div>
            )}

            <form onSubmit={handleSend} className="relative group">
                <div className={`flex items-center gap-2 bg-white/5 backdrop-blur-3xl rounded-[28px] p-1.5 transition-all duration-500 min-h-[60px] border border-white/5
                    ${isThinking ? 'opacity-80' : 'group-focus-within:bg-white/10 group-focus-within:border-purple-500/30 group-focus-within:shadow-[0_0_30px_rgba(139,92,246,0.15)] shadow-xl'}`}>
                    
                    {/* Attachment Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-11 h-11 flex items-center justify-center text-white/40 hover:text-purple-400 hover:bg-white/5 rounded-full transition-all shrink-0"
                        title="Attach image or PDF"
                    >
                        <Paperclip size={20} className="-rotate-45" />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept="image/*,.pdf" 
                        className="hidden" 
                    />

                    {/* Text Input */}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening to you..." : "Instant inquiry..."}
                        disabled={isThinking}
                        className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[15px] font-medium text-white placeholder-white/20 px-3 leading-relaxed"
                    />
                    
                    {/* Right Action Group */}
                    <div className="flex items-center gap-1.5 pr-0.5">
                        {/* Mic Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onMouseDown={onPTTStart}
                            onMouseUp={onPTTEnd}
                            onTouchStart={onPTTStart}
                            onTouchEnd={onPTTEnd}
                            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300
                                ${isListening 
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse' 
                                    : 'text-white/40 hover:text-purple-400 hover:bg-white/5'}`}
                            title="Hold to talk"
                        >
                            <Mic size={20} className={isListening ? "scale-110" : ""} />
                        </motion.button>

                        {/* Send Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={isThinking || (!input.trim() && !selectedImage)}
                            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-500 shadow-lg
                                ${isThinking || (!input.trim() && !selectedImage)
                                    ? 'bg-white/5 text-white/10' 
                                    : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:bg-indigo-500'}`}
                        >
                            {isThinking ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} className="ml-0.5" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </form>
        </div>
    );
};

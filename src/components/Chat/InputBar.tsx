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

            <form onSubmit={handleSend} className="relative group/form">
                <div className={`w-full flex items-center gap-2 bg-[#32343e]/40 backdrop-blur-3xl rounded-[28px] p-2 md:p-3 transition-all duration-500 min-h-[70px] border border-white/10
                    ${isThinking ? 'opacity-80' : 'group-focus-within/form:bg-[#32343e]/60 group-focus-within/form:border-[#5d21df]/50 group-focus-within/form:shadow-[0_0_50px_rgba(93,33,223,0.2)] shadow-2xl'}`}>
                    
                    {/* Attachment Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 flex items-center justify-center text-white/30 hover:text-[#cdbdff] hover:bg-white/5 rounded-2xl transition-all shrink-0"
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
                        name="exa-query-unique"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening to you..." : "Instant inquiry..."}
                        disabled={isThinking}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        enterKeyHint="send"
                        inputMode="text"
                        className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 outline-none text-base font-manrope text-white placeholder-white/10 px-4 leading-relaxed"
                    />
                    
                    {/* Right Action Group */}
                    <div className="flex items-center gap-1">
                        {/* Mic Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onMouseDown={onPTTStart}
                            onMouseUp={onPTTEnd}
                            onTouchStart={onPTTStart}
                            onTouchEnd={onPTTEnd}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300
                                ${isListening 
                                    ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' 
                                    : 'text-white/30 hover:text-[#cdbdff] hover:bg-white/5'}`}
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
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500 shadow-[0_10px_25px_rgba(93,33,223,0.3)]
                                 ${isThinking || (!input.trim() && !selectedImage)
                                    ? 'bg-white/10 text-white/20 cursor-not-allowed shadow-none' 
                                    : 'bg-gradient-to-br from-[#5d21df] to-[#153ae4] text-white hover:shadow-[0_15px_35px_rgba(93,33,223,0.5)]'}`}
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

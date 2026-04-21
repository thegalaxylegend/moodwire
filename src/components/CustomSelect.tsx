import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { usePerformance } from '../context/PerformanceProvider';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    icon?: React.ReactNode;
    required?: boolean;
    placement?: 'top' | 'bottom';
    compact?: boolean;
}

export const CustomSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder = "Select an option",
    icon,
    required = false,
    placement = 'bottom',
    compact = false
}: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { tier } = usePerformance();
    const isLow = tier === 'low';

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            {label && (
                <label className="text-sm font-bold text-text-muted uppercase tracking-widest px-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className={`relative ${isOpen ? 'z-[200]' : 'z-[100]'}`}>
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-surface/50 backdrop-blur-md border ${isOpen ? 'border-primary ring-4 ring-primary/10' : 'border-white/10 hover:border-white/20'} rounded-2xl ${compact ? 'py-2 pl-4 pr-10' : 'py-4 pl-5 pr-12'} text-left flex items-center gap-3 transition-all duration-500 hover:bg-white/5 group relative overflow-hidden`}
                >
                    {/* Subtle inner glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                    
                    {icon && <span className="text-text-muted group-hover:text-primary transition-colors relative z-10">{icon}</span>}

                    <span className={`block truncate font-bold relative z-10 ${compact ? 'text-xs' : 'text-lg'} ${!selectedOption ? 'text-text-muted/70' : 'text-white'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>

                    <div className="absolute right-5 inset-y-0 flex items-center pointer-events-none z-10">
                        <div 
                            className="transition-transform duration-500"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            <ChevronDown size={22} className={isOpen ? 'text-primary' : 'text-text-muted'} />
                        </div>
                    </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={isLow ? { opacity: 0 } : { opacity: 0, y: placement === 'top' ? 10 : -10, scale: 0.95 }}
                            animate={isLow ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                            exit={isLow ? { opacity: 0 } : { opacity: 0, y: placement === 'top' ? 10 : -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className={`absolute ${placement === 'top' ? 'bottom-full mb-3 origin-bottom' : 'top-full mt-3 origin-top'} z-[110] w-full bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar`}
                        >
                            {/* Dropdown Arrow Decor */}
                            {!isLow && (
                                <div className={`absolute ${placement === 'top' ? '-bottom-1.5' : '-top-1.5'} left-8 w-3 h-3 bg-[#0a0a0a] border-l border-t border-white/10 rotate-45 z-0`} 
                                     style={placement === 'top' ? { transform: 'rotate(225deg)' } : {}}
                                />
                            )}
                            
                            <div className="p-2 relative z-10">
                                {options.map((option, i) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <motion.button
                                            key={option.value}
                                            type="button"
                                            initial={isLow ? {} : { opacity: 0, x: -10 }}
                                            animate={isLow ? {} : { opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03, duration: 0.3 }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelect(option.value);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base cursor-pointer select-none transition-all duration-300 group ${isSelected
                                                ? 'bg-primary/20 text-primary font-bold shadow-inner'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                                }`}
                                        >
                                            <span className="truncate">{option.label}</span>
                                            {isSelected && (
                                                <motion.div
                                                    initial={isLow ? {} : { scale: 0 }}
                                                    animate={isLow ? {} : { scale: 1 }}
                                                    className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                                                >
                                                    <Check size={14} className="text-primary" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


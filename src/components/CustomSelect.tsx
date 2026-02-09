import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

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
}

export const CustomSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder = "Select an option",
    icon,
    required = false
}: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
        <div className="space-y-2" ref={containerRef}>
            {label && (
                <label className="text-sm font-medium text-text-main">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-surface border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border'} rounded-lg py-3 pl-4 pr-10 text-left flex items-center gap-3 transition-all duration-200 hover:bg-surface/80 group`}
                >
                    {icon && <span className="text-text-muted group-hover:text-primary transition-colors">{icon}</span>}

                    <span className={`block truncate ${!selectedOption ? 'text-text-muted/70' : 'text-text-main'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted transition-transform duration-200" style={{ transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>
                        <ChevronDown size={18} />
                    </span>
                </button>

                {/* Dropdown Menu - Opens UPWARD to avoid overflow */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute bottom-full mb-2 z-[999] w-full bg-surface backdrop-blur-xl border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar"
                            style={{
                                boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div className="p-1">
                                {options.map((option) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelect(option.value);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm cursor-pointer select-none transition-colors ${isSelected
                                                ? 'bg-primary/20 text-primary font-medium'
                                                : 'text-text-main hover:bg-primary/20'
                                                }`}
                                        >
                                            <span className="truncate">{option.label}</span>
                                            {isSelected && <Check size={16} />}
                                        </button>
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

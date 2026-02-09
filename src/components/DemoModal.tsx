import { X } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface DemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DemoModal = ({ isOpen, onClose }: DemoModalProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.play().catch(e => console.log('Autoplay blocked', e));
        } else if (!isOpen && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white">
            <div className="relative w-full max-w-5xl bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scale-in group">
                {/* Header / Controls Overlay */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                    <X size={24} />
                </button>

                <div className="relative aspect-video bg-black flex items-center justify-center">
                    <video
                        ref={videoRef}
                        src="/demo.mp4"
                        controls
                        className="w-full h-full object-contain"
                        loop
                        preload="none"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
};

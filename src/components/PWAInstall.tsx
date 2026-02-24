import { Download, X, Share, Info, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { usePWA } from '../hooks/usePWA';
import { usePWAStore } from '../store/pwaStore';

export const PWAInstall = () => {
    const { isStandalone, isIOS } = usePWA();
    const { showInstallModal, setShowInstallModal } = usePWAStore();

    // SW Registration for Auto-Updates
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW();

    const closeNeedRefresh = () => {
        setNeedRefresh(false);
    };

    if (isStandalone && !needRefresh) return null;

    return (
        <>
            {/* Auto-Update Notification */}
            {needRefresh && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-md">
                    <div className="glass-card bg-primary/20 backdrop-blur-2xl border border-primary/30 p-4 rounded-3xl shadow-3xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <RefreshCw className="text-primary animate-spin-slow" size={20} />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Update Available</p>
                                    <p className="text-primary/70 text-xs">New features are ready for you.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateServiceWorker(true)}
                                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-white text-xs font-bold rounded-xl transition-colors"
                                >
                                    Refresh Now
                                </button>
                                <button onClick={closeNeedRefresh} className="p-2 text-primary/70 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Installation Guide Modal (iOS / Manual) */}
            {showInstallModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInstallModal(false)} />

                    <div className="relative glass-card bg-zinc-900 border border-white/10 p-8 rounded-[40px] max-w-md w-full shadow-3xl">
                        <button
                            onClick={() => setShowInstallModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-xl">
                                <Download size={40} className="text-white" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">Get Exam Compass Pro</h3>
                                <p className="text-gray-400 text-sm">Experience the full native app with zero lag, instant updates, and protected content.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <div className="text-primary font-bold text-sm mb-1">Auto-Sync</div>
                                    <div className="text-[10px] text-gray-500 line-clamp-2">Always latest version on every launch</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <div className="text-primary font-bold text-sm mb-1">Anti-Copy</div>
                                    <div className="text-[10px] text-gray-500 line-clamp-2">Protected study material & questions</div>
                                </div>
                            </div>

                            {isIOS ? (
                                <div className="space-y-4 p-6 bg-primary/10 rounded-3xl text-left border border-primary/20">
                                    <p className="text-sm font-semibold text-primary/70">Fast Install (iOS):</p>
                                    <ol className="space-y-3 text-sm text-gray-300">
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">1</span>
                                            <span className="flex items-center gap-1.5">Tap <Share size={16} className="text-blue-400" /> Share below</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">2</span>
                                            <span>Select <span className="text-white font-bold">"Add to Home Screen"</span></span>
                                        </li>
                                    </ol>
                                </div>
                            ) : (
                                <div className="space-y-4 p-6 bg-primary/10 rounded-3xl text-left border border-primary/20">
                                    <p className="text-sm font-semibold text-primary/70">App Installation:</p>
                                    <ol className="space-y-3 text-sm text-gray-300">
                                        <li className="flex items-center gap-3">
                                            <Download size={16} className="text-primary" />
                                            <span>Tap <strong>"Install"</strong> in your browser bar.</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <Info size={16} className="text-primary" />
                                            <span>The app will appear in your launcher immediately.</span>
                                        </li>
                                    </ol>
                                </div>
                            )}

                            <button
                                onClick={() => setShowInstallModal(false)}
                                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

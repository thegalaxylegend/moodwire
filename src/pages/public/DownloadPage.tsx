import { Smartphone, Download, Sparkles, Laptop, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePWAStore } from '../../store/pwaStore';
import { usePWA } from '../../hooks/usePWA';

export const DownloadPage = () => {
    const { isIOS, installApp } = usePWA();
    const { setShowInstallModal } = usePWAStore();
    const [downloading, setDownloading] = useState(false);

    const handleApkDownload = () => {
        setDownloading(true);
        // Direct download link pointing to public folder
        const link = document.createElement('a');
        const apkUrl = new URL('/examcompass.apk', window.location.origin);
        apkUrl.searchParams.set('v', String(Date.now()));
        link.href = apkUrl.toString();
        link.download = 'examcompass.apk';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
            setDownloading(false);
        }, 3000);
    };

    const handlePwaInstall = async () => {
        if (isIOS) {
            setShowInstallModal(true);
            return;
        }

        const outcome = await installApp();
        if (outcome === 'no-prompt') {
            setShowInstallModal(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Helmet>
                <title>Download Exam Compass App | Android APK & PWA Install</title>
                <meta name="description" content="Get the Exam Compass native application on your Android, iOS, or Desktop device completely free. Enjoy instant revisions, ELO strength meters, and offline support with zero storage limits." />
                <link rel="canonical" href="https://examcompass.pages.dev/download" />
            </Helmet>

            {/* Glowing background details */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-16 relative z-10">
                {/* Header Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold">
                        <Sparkles size={16} />
                        100% Free App Installation
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-purple-400">
                        Learn Anywhere, <br />
                        <span className="text-purple-400">Revise Anytime</span>
                    </h1>
                    <p className="text-gray-400 text-lg sm:text-xl leading-relaxed">
                        Say goodbye to App Store fees and storage limits. Install Exam Compass directly onto your device in seconds for a distraction-free, lightning-fast study experience.
                    </p>
                </div>

                {/* Primary Installation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card 1: Direct Android APK */}
                    <div className="glass-card bg-zinc-900/50 border border-white/10 rounded-[32px] p-8 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                                <Smartphone className="text-purple-400" size={28} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-bold text-white">Direct Android App (APK)</h3>
                                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Android 8+</span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Download the standalone Android package directly from our secure servers. No Google account required. Perfect for dedicated offline mock exams and zero distractions.
                                </p>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-center gap-2.5">
                                    <Zap size={16} className="text-purple-400" />
                                    Instant loading with zero browser address bar
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <ShieldCheck size={16} className="text-purple-400" />
                                    Protected study environment & ELO meters
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Download size={16} className="text-purple-400" />
                                    Very small size (&lt; 5MB download)
                                </li>
                            </ul>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <button
                                onClick={handleApkDownload}
                                disabled={downloading}
                                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50"
                            >
                                <Download size={20} />
                                {downloading ? 'Starting Download...' : 'Download Android APK'}
                            </button>
                            <p className="text-center text-[10px] text-gray-500 mt-3">
                                Secure checksum verified. Works on Samsung, Redmi, Vivo, Oppo & OnePlus.
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Instant PWA Install */}
                    <div className="glass-card bg-zinc-900/50 border border-white/10 rounded-[32px] p-8 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                <Laptop className="text-indigo-400" size={28} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-bold text-white">Browser Installation (PWA)</h3>
                                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">Cross-Platform</span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Install directly from your mobile or desktop web browser. It takes up absolutely zero space and runs natively with standard web speeds.
                                </p>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-center gap-2.5">
                                    <Zap size={16} className="text-indigo-400" />
                                    Installs in just 2 taps without download waiting
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <ShieldCheck size={16} className="text-indigo-400" />
                                    Perfect for iOS, Android, and Desktop PC
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Laptop size={16} className="text-indigo-400" />
                                    Zero storage footprint on your device
                                </li>
                            </ul>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <button
                                onClick={handlePwaInstall}
                                className="w-full py-4 px-6 bg-white text-black hover:bg-gray-100 font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg"
                            >
                                <Smartphone size={20} />
                                {isIOS ? 'Show iOS Setup Guide' : 'Install Directly Now'}
                            </button>
                            <p className="text-center text-[10px] text-gray-500 mt-3">
                                Safe, lightweight sandbox. Fast install on Chrome, Safari, or Edge.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Block: Auto-updates explanation */}
                <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-[32px] flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2.5 text-purple-400 font-bold text-lg">
                            <Zap size={20} />
                            No App Store Updates Required!
                        </div>
                        <p className="text-gray-400 text-sm max-w-2xl">
                            Both the APK and PWA are linked directly to our global servers. When we deploy fresh syllabus updates or new mock features, your app will automatically apply them on launch. You never have to manually update again.
                        </p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-8">
                    <h3 className="text-3xl font-bold text-center text-white flex items-center justify-center gap-3">
                        <HelpCircle size={28} className="text-purple-400" />
                        Frequently Asked Questions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-2.5">
                            <h4 className="text-lg font-bold text-white">Why isn't this on the Google Play Store?</h4>
                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                We believe education should be completely free and accessible. By bypassing expensive corporate app store commissions, developer fees, and long approval cycles, we keep Exam Compass 100% free of charge for all competitive exam aspirants (JEE, NEET, Board prep) without compromising features.
                            </p>
                        </div>
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-2.5">
                            <h4 className="text-lg font-bold text-white">Is installing a direct APK safe?</h4>
                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                Absolutely. The APK is compiled securely on our systems using Google's Capacitor SDK. Android might warn you about "unknown sources" because it wasn't downloaded from Google's store—simply tap "Install Anyway" or enable "Allow from this source" in your settings.
                            </p>
                        </div>
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-2.5">
                            <h4 className="text-lg font-bold text-white">Does the application work offline?</h4>
                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                Yes. Due to our extensive Workbox runtime caching strategies, once loaded, core pages, revision templates, formulas, and mock questions are securely stored locally so you can continue your practice in areas with poor internet connection.
                            </p>
                        </div>
                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-2.5">
                            <h4 className="text-lg font-bold text-white">How do I install the app on an iPhone (iOS)?</h4>
                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                Open Safari, go to `https://examcompass.pages.dev`, tap the standard **Share** button in Safari's bottom toolbar, and select **"Add to Home Screen"**. It will appear instantly as a native app with zero store barriers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

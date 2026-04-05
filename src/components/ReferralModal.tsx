import { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { registerReferralCode } from '../services/referralService';
import { Copy, Check, Share2, Users, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_URL } from '../lib/siteConfig';

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReferralModal = ({ isOpen, onClose }: ReferralModalProps) => {
    const { user, updateProfile } = useUserStore();
    const [code, setCode] = useState(user?.referralCode || "");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateCode = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const newCode = await registerReferralCode(user.id);
            if (newCode) {
                setCode(newCode);
                updateProfile({ referralCode: newCode });
            }
        } catch (e) {
            console.error("Failed to generate code", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const link = `${SITE_URL}/login?ref=${code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const link = `${SITE_URL}/login?ref=${code}`;
        const shareData = {
            title: 'Join Exam Compass',
            text: `Join me on Exam Compass to ace your exams! Use my code ${code} to get a head start.`,
            url: link
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // Ignore abort
            }
        } else {
            handleCopy();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <Users size={48} className="mx-auto text-indigo-400 mb-3 relative z-10" />
                        <h2 className="text-2xl font-bold text-white relative z-10">Refer & Earn XP</h2>
                        <p className="text-white/60 text-sm mt-1 relative z-10">Invite friends and boost your rank together!</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                    <Trophy size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-white/40 uppercase font-bold">Total Referred</p>
                                    <p className="text-xl font-bold text-white">{user?.referralCount || 0} Friends</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <Trophy size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-white/40 uppercase font-bold">XP Earned</p>
                                    <p className="text-xl font-bold text-white">{(user?.referralCount || 0) * 500} XP</p>
                                </div>
                            </div>
                        </div>

                        {/* Code Generation / Display */}
                        {code ? (
                            <div className="space-y-3">
                                <label className="text-xs text-white/40 uppercase font-bold ml-1">Your Referral Link</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-white/80 font-mono text-sm truncate">
                                        {SITE_URL}/login?ref={code}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                        title="Copy Link"
                                    >
                                        {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                    </button>
                                </div>


                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            const link = `${SITE_URL}/login?ref=${code}`;
                                            const text = encodeURIComponent(`I'm preparing for ${user?.targetExam || 'competitive exams'} on Exam Compass! Join me and get a head start 🚀\n${link}`);
                                            window.open(`https://wa.me/?text=${text}`, '_blank');
                                        }}
                                        className="py-3 bg-green-600/90 hover:bg-green-600 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={() => {
                                            const link = `${SITE_URL}/login?ref=${code}`;
                                            const text = encodeURIComponent(`Prepare for ${user?.targetExam || 'competitive exams'} on Exam Compass! 🎯 ${link}`);
                                            window.open(`https://www.threads.net/intent/post?text=${text}`, '_blank');
                                        }}
                                        className="py-3 bg-white text-black border border-white/20 hover:bg-gray-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
                                        Threads
                                    </button>
                                    <button
                                        onClick={() => {
                                            const link = `${SITE_URL}/login?ref=${code}`;
                                            const text = encodeURIComponent(`Preparing for ${user?.targetExam || 'competitive exams'}? Exam Compass has AI mock tests & study plans. Try it free!`);
                                            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`, '_blank');
                                        }}
                                        className="py-3 bg-black border border-white/20 hover:bg-white/10 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        X / Twitter
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] transition-transform rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                                    >
                                        <Share2 size={16} /> Share Link
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-white/60 text-sm mb-4">Generate your unique code to start inviting friends.</p>
                                <button
                                    onClick={generateCode}
                                    disabled={loading}
                                    className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Get My Referral Code'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-black/20 text-center border-t border-white/5">
                        <button onClick={onClose} className="text-white/40 hover:text-white text-sm">Close</button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

import { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { registerReferralCode } from '../services/referralService';
import { Copy, Check, Share2, Users, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        const link = `https://examcompass.pages.dev/login?ref=${code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const link = `https://examcompass.pages.dev/login?ref=${code}`;
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
                                        https://examcompass.pages.dev/login?ref={code}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                        title="Copy Link"
                                    >
                                        {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <button
                                    onClick={handleShare}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] transition-transform rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Share2 size={18} /> Share with Friends
                                </button>
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

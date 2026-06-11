import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings as SettingsIcon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const TopRightProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const dropdownVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 }
    };

    return (
        <div className="top-profile-container" style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 100,
        }}>
            <motion.div
                className="profile-trigger glass glass-hover"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '100px',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)'
                }}
            >
                <div className="profile-mini-avatar" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #333, #000)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
                }}>
                    {user?.email?.[0].toUpperCase() || 'V'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>Vibe Master</span>
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', opacity: 0.6 }} />
            </motion.div>

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        className="profile-dropdown glass"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={dropdownVariants}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 1rem)',
                            right: 0,
                            width: '210px',
                            background: 'rgba(12, 12, 12, 0.95)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '18px',
                            padding: '0.6rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(255, 0, 0, 0.05)',
                            transformOrigin: 'top right'
                        }}
                    >
                        <motion.button
                            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            whileTap={{ scale: 0.98 }}
                            className="profile-dropdown-item"
                            onClick={() => { navigate('/settings'); setIsOpen(false); }}
                        >
                            <User size={18} />
                            <span>Profile</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            whileTap={{ scale: 0.98 }}
                            className="profile-dropdown-item"
                            onClick={() => { navigate('/settings'); setIsOpen(false); }}
                        >
                            <SettingsIcon size={18} />
                            <span>Settings</span>
                        </motion.button>
                        <div className="profile-dropdown-divider" />
                        <motion.button
                            whileHover={{ x: 5, backgroundColor: 'rgba(255, 68, 68, 0.15)' }}
                            whileTap={{ scale: 0.98 }}
                            className="profile-dropdown-item danger"
                            onClick={() => { logout(); setIsOpen(false); }}
                        >
                            <LogOut size={18} />
                            <span>Log Out</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(TopRightProfile);

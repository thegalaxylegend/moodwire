import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Search as SearchIcon, Library as LibraryIcon, Settings as SettingsIcon, Heart, Zap, Smile, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

const Sidebar: React.FC = () => {
    const { setSidebarCollapsed } = useThemeStore();
    const vibes = [
        { id: 'love', name: 'Love', icon: <Heart size={18} />, color: '#ff0000' },
        { id: 'sad', name: 'Sad', icon: <Smile size={18} />, color: '#ffffff' },
        { id: 'pop', name: 'Pop', icon: <Headphones size={18} />, color: '#cc0000' },
        { id: 'lofi', name: 'Lofi', icon: <Zap size={18} />, color: '#666666' },
        { id: 'old', name: 'Old Songs', icon: <Headphones size={18} />, color: '#aaaaaa' },
    ];

    const containerVariants = {
        hidden: { opacity: 0, x: -20 },
        show: {
            opacity: 1,
            x: 0,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <motion.aside
            className="sidebar glass"
            initial="hidden"
            animate="show"
            variants={containerVariants}
            onMouseEnter={() => setSidebarCollapsed(false)}
            onMouseLeave={() => setSidebarCollapsed(true)}
        >
            <div className="sidebar-scroll-content">
                <div className="logo-container">
                    <div className="logo-main" style={{ paddingLeft: '0.5rem' }}>
                        <h1 className="logo-text">Mood<span>Wire</span></h1>
                    </div>
                </div>

                <nav className="nav-section">
                    {[
                        { to: "/", icon: <HomeIcon size={20} />, label: "Home" },
                        { to: "/search", icon: <SearchIcon size={20} />, label: "Search" },
                        { to: "/library", icon: <LibraryIcon size={20} />, label: "Library" },
                    ].map((item) => (
                        <motion.div
                            key={item.to}
                            variants={itemVariants}
                            whileHover={{ x: 5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <NavLink
                                to={item.to}
                                className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        </motion.div>
                    ))}
                </nav>

                <div className="sidebar-divider" />

                <div className="vibe-section">
                    <h3 className="section-title">Live Vibes</h3>
                    {vibes.map((vibe) => (
                        <motion.div
                            key={vibe.id}
                            variants={itemVariants}
                            whileHover={{ x: 5, scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <NavLink
                                to={`/vibes/${vibe.id}`}
                                className={({ isActive }: { isActive: boolean }) => `vibe-item ${isActive ? 'active' : ''}`}
                                style={{ '--vibe-color': vibe.color } as React.CSSProperties}
                            >
                                {vibe.icon}
                                <span>{vibe.name}</span>
                            </NavLink>
                        </motion.div>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ x: 5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <NavLink
                            to="/settings"
                            className={({ isActive }: { isActive: boolean }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <SettingsIcon size={20} />
                            <span>Settings</span>
                        </NavLink>
                    </motion.div>
                </div>
            </div>
        </motion.aside>
    );
};

export default React.memo(Sidebar);

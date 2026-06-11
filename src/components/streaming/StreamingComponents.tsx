import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { DisplayTransformer } from '../../utils/DisplayTransformer';

interface SectionHeaderProps {
    title: string;
    onSeeAll?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = memo(({ title, onSeeAll }) => (
    <motion.div
        className="section-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
    >
        <h2>{title}</h2>
        {onSeeAll && <motion.span whileHover={{ scale: 1.05, color: '#fff' }} className="see-all" onClick={onSeeAll}>See All</motion.span>}
    </motion.div>
));

interface AlbumCardProps {
    imageUrl: string;
    title: string;
    subtitle: string;
    onClick?: () => void;
    index?: number;
}

export const AlbumCard: React.FC<AlbumCardProps> = memo(({ imageUrl, title, subtitle, onClick, index = 0 }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) return null;

    return (
        <motion.div
            className="album-card"
            onClick={onClick}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: index * 0.1
            }}
        >
            <motion.img
                src={imageUrl}
                alt={DisplayTransformer.cleanTitle(title)}
                loading="lazy"
                onError={() => setHasError(true)}
            />
            <div className="title">{DisplayTransformer.cleanTitle(title)}</div>
            <div className="subtitle">{DisplayTransformer.cleanArtist(subtitle)}</div>
        </motion.div>
    );
});

interface GridCardProps {
    imageUrl?: string;
    title: string;
    onClick?: () => void;
    index?: number;
    icon?: any;
    colors?: string;
}

export const GridCard: React.FC<GridCardProps> = memo(({ imageUrl, title, onClick, index = 0, icon: Icon, colors }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) return null;

    return (
        <motion.div
            className="grid-card"
            onClick={onClick}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            {Icon && colors ? (
                <div className="grid-card-special-art" style={{ background: colors }}>
                    <Icon size={24} color="#fff" fill="currentColor" />
                </div>
            ) : (
                <img src={imageUrl} alt={DisplayTransformer.cleanTitle(title)} loading="lazy" onError={() => setHasError(true)} />
            )}
            <span>{DisplayTransformer.cleanTitle(title)}</span>
        </motion.div>
    );
});

interface FilterChipProps {
    label: string;
    active?: boolean;
    onClick?: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = memo(({ label, active, onClick }) => (
    <motion.div
        className={`filter-chip ${active ? 'active' : ''}`}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        layout
    >
        {label}
    </motion.div>
));

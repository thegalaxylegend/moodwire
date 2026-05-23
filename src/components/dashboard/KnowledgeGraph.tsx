import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, Filter, Search, Award, Zap, Crosshair } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { EloService } from '../../services/eloService';
import { usePerformance } from '../../context/PerformanceProvider';

interface Node {
    id: string;
    label: string;
    subject: 'physics' | 'chemistry' | 'math';
    type: 'core' | 'subtopic';
    x: number;
    y: number;
    ratingKey: string;
    description: string;
}

interface Edge {
    source: string;
    target: string;
    subject: 'physics' | 'chemistry' | 'math';
}

const NODES: Node[] = [
    // --- Physics Cluster (Centroid: 300, 300) ---
    { id: 'phy_core', label: 'Physics', subject: 'physics', type: 'core', x: 300, y: 300, ratingKey: 'physics', description: 'Core principles of space, time, matter, and energy.' },
    { id: 'phy_mechanics', label: 'Mechanics', subject: 'physics', type: 'subtopic', x: 200, y: 200, ratingKey: 'mechanics', description: 'Kinematics, Newton\'s Laws, Work, Power, Energy & Rotational Dynamics.' },
    { id: 'phy_electro', label: 'Electrodynamics', subject: 'physics', type: 'subtopic', x: 180, y: 320, ratingKey: 'electrodynamics', description: 'Electrostatics, Gauss\'s Law, Current Electricity & Magnetic Effects.' },
    { id: 'phy_thermo', label: 'Thermodynamics', subject: 'physics', type: 'subtopic', x: 260, y: 420, ratingKey: 'thermodynamics_physics', description: 'Kinetic Theory of Gases, Heat Transfer & laws of Thermodynamics.' },
    { id: 'phy_optics', label: 'Optics & Waves', subject: 'physics', type: 'subtopic', x: 420, y: 220, ratingKey: 'optics', description: 'Ray Optics, Wave Optics & Simple Harmonic Motion.' },
    { id: 'phy_modern', label: 'Modern Physics', subject: 'physics', type: 'subtopic', x: 400, y: 380, ratingKey: 'modern_physics', description: 'Dual Nature of Matter, Atoms, Nuclei & Semiconductor Devices.' },

    // --- Chemistry Cluster (Centroid: 700, 300) ---
    { id: 'chem_core', label: 'Chemistry', subject: 'chemistry', type: 'core', x: 700, y: 300, ratingKey: 'chemistry', description: 'Study of substances, chemical reactions, and bonds.' },
    { id: 'chem_physical', label: 'Physical Chemistry', subject: 'chemistry', type: 'subtopic', x: 600, y: 200, ratingKey: 'physical_chemistry', description: 'Mole Concept, Equilibrium, Chemical Kinetics & Electrochemistry.' },
    { id: 'chem_organic', label: 'Organic Chemistry', subject: 'chemistry', type: 'subtopic', x: 580, y: 320, ratingKey: 'organic_chemistry', description: 'GOC, Hydrocarbons, Carbonyl Compounds & Biomolecules.' },
    { id: 'chem_inorganic', label: 'Inorganic Chemistry', subject: 'chemistry', type: 'subtopic', x: 660, y: 420, ratingKey: 'inorganic_chemistry', description: 'Periodic Table, Chemical Bonding, Coordination & p-block Elements.' },
    { id: 'chem_bonding', label: 'Chemical Bonding', subject: 'chemistry', type: 'subtopic', x: 820, y: 220, ratingKey: 'chemical_bonding', description: 'Molecular Orbitals, Hybridization, VSEPR Theory & dipole moments.' },
    { id: 'chem_solutions', label: 'Solutions & States', subject: 'chemistry', type: 'subtopic', x: 800, y: 380, ratingKey: 'solutions_states', description: 'Liquid Solutions, Colligative Properties & Solid State characteristics.' },

    // --- Math Cluster (Centroid: 500, 600) ---
    { id: 'math_core', label: 'Mathematics', subject: 'math', type: 'core', x: 500, y: 600, ratingKey: 'math', description: 'The language of logic, quantity, space, and change.' },
    { id: 'math_algebra', label: 'Algebra', subject: 'math', type: 'subtopic', x: 380, y: 550, ratingKey: 'algebra', description: 'Quadratic Equations, Complex Numbers, Matrices, Determinants & Probability.' },
    { id: 'math_calculus', label: 'Calculus', subject: 'math', type: 'subtopic', x: 420, y: 700, ratingKey: 'calculus', description: 'Limits, Continuity, Differentiation, Definite Integrals & Area under Curves.' },
    { id: 'math_coord', label: 'Coordinate Geometry', subject: 'math', type: 'subtopic', x: 580, y: 700, ratingKey: 'coordinate_geometry', description: 'Straight Lines, Circles, Parabola, Ellipse & Hyperbola.' },
    { id: 'math_vectors', label: 'Vectors & 3D', subject: 'math', type: 'subtopic', x: 620, y: 550, ratingKey: 'vectors_3d', description: 'Vector Algebra, Dot/Cross Products & Shortest Distance between lines.' },
    { id: 'math_trig', label: 'Trigonometry', subject: 'math', type: 'subtopic', x: 500, y: 480, ratingKey: 'trigonometry', description: 'Trigonometric Identities, Inverse Functions & Height-Distance applications.' }
];

const EDGES: Edge[] = [
    // Physics Links
    { source: 'phy_core', target: 'phy_mechanics', subject: 'physics' },
    { source: 'phy_core', target: 'phy_electro', subject: 'physics' },
    { source: 'phy_core', target: 'phy_thermo', subject: 'physics' },
    { source: 'phy_core', target: 'phy_optics', subject: 'physics' },
    { source: 'phy_core', target: 'phy_modern', subject: 'physics' },

    // Chemistry Links
    { source: 'chem_core', target: 'chem_physical', subject: 'chemistry' },
    { source: 'chem_core', target: 'chem_organic', subject: 'chemistry' },
    { source: 'chem_core', target: 'chem_inorganic', subject: 'chemistry' },
    { source: 'chem_core', target: 'chem_bonding', subject: 'chemistry' },
    { source: 'chem_core', target: 'chem_solutions', subject: 'chemistry' },

    // Math Links
    { source: 'math_core', target: 'math_algebra', subject: 'math' },
    { source: 'math_core', target: 'math_calculus', subject: 'math' },
    { source: 'math_core', target: 'math_coord', subject: 'math' },
    { source: 'math_core', target: 'math_vectors', subject: 'math' },
    { source: 'math_core', target: 'math_trig', subject: 'math' },

    // Inter-disciplinary Conduits (Advanced flow vectors!)
    { source: 'phy_thermo', target: 'chem_physical', subject: 'chemistry' },
    { source: 'math_calculus', target: 'phy_mechanics', subject: 'physics' },
    { source: 'chem_bonding', target: 'phy_modern', subject: 'physics' }
];

export const KnowledgeGraph: React.FC = () => {
    const { user } = useUserStore();
    const navigate = useNavigate();
    const { tier } = usePerformance();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<'all' | 'physics' | 'chemistry' | 'math'>('all');
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(NODES[0]);
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
    const [graphAngle, setGraphAngle] = useState(0);
    const [autoRotate, setAutoRotate] = useState(true);

    // Pan & Zoom States
    const [zoomScale, setZoomScale] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isZooming, setIsZooming] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const zoomingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Detect mobile device
    const isMobile = useMemo(() => {
        return typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }, []);

    // Intersection Observer to pause rendering loop when offscreen
    const [isIntersecting, setIsIntersecting] = useState(true);
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, { threshold: 0.05 });
        
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // Record interaction to delay auto-return & auto-rotation
    const recordInteraction = () => {
        setAutoRotate(false);
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
        }
        resetTimeoutRef.current = setTimeout(() => {
            setPanOffset({ x: 0, y: 0 });
            setZoomScale(1);
            setAutoRotate(true);
        }, 5000); // 5 seconds of idle returns to original position
    };

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            if (zoomingTimeoutRef.current) clearTimeout(zoomingTimeoutRef.current);
        };
    }, []);

    // Wheel zoom implementation
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            recordInteraction();
            setIsZooming(true);
            
            setZoomScale(prev => {
                const newScale = prev + e.deltaY * -0.0015;
                return Math.min(3.0, Math.max(0.5, newScale));
            });

            if (zoomingTimeoutRef.current) {
                clearTimeout(zoomingTimeoutRef.current);
            }
            zoomingTimeoutRef.current = setTimeout(() => {
                setIsZooming(false);
            }, 150);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Dynamic rotation for idle animation with adaptive performance-aware frame rates
    useEffect(() => {
        if (!autoRotate || !isIntersecting || tier === 'low') return;

        // Adaptive interval: Low = inactive, Balanced = 120ms, Mobile = 120ms, Elite Desktop = 45ms
        const activeInterval = tier === 'balanced' ? 120 : (isMobile ? 120 : 45);
        const step = activeInterval === 45 ? 0.15 : 0.45; // Keep visual rotation speed consistent

        const interval = setInterval(() => {
            setGraphAngle(prev => (prev + step) % 360);
        }, activeInterval);

        return () => clearInterval(interval);
    }, [autoRotate, isIntersecting, tier, isMobile]);

    // Handle mouse move for 3D parallax effect & dragging
    const handleMouseMove = (e: React.MouseEvent) => {
        recordInteraction();
        
        if (isDragging) {
            setPanOffset({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
            setMouseOffset({ x: 0, y: 0 }); // Lock parallax on drag
        } else {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = (e.clientX - centerX) / (rect.width / 2);
            const y = (e.clientY - centerY) / (rect.height / 2);
            setMouseOffset({ x, y });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only
        recordInteraction();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - panOffset.x,
            y: e.clientY - panOffset.y
        };
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        recordInteraction();
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setMouseOffset({ x: 0, y: 0 });
        recordInteraction();
    };

    // Mobile touch controls
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        recordInteraction();
        setIsDragging(true);
        const touch = e.touches[0];
        dragStartRef.current = {
            x: touch.clientX - panOffset.x,
            y: touch.clientY - panOffset.y
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        recordInteraction();
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        setPanOffset({
            x: touch.clientX - dragStartRef.current.x,
            y: touch.clientY - dragStartRef.current.y
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        recordInteraction();
    };

    // Calculate node ratings based on Firestore/Zustand user profile
    const calibration = user?.calibrationProfile;

    const getNodeRating = (node: Node): number => {
        if (!calibration) return 1000;
        if (node.type === 'core') {
            return calibration.subjectRatings?.[node.ratingKey] || calibration.overall || 1000;
        }
        return calibration.topicRatings?.[node.ratingKey] || 1000;
    };

    // Style helper for nodes based on ELO rating
    const getRatingColor = (rating: number) => {
        if (rating < 850) return {
            stroke: 'rgba(239, 68, 68, 0.8)', // red
            glow: 'rgba(239, 68, 68, 0.4)',
            text: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.1)',
            label: 'Concept Rebuilding Required'
        };
        if (rating < 1150) return {
            stroke: 'rgba(245, 158, 11, 0.8)', // amber
            glow: 'rgba(245, 158, 11, 0.4)',
            text: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.1)',
            label: 'Developing / Challenge Zone'
        };
        return {
            stroke: 'rgba(129, 236, 255, 0.8)', // neon blue
            glow: 'rgba(129, 236, 255, 0.4)',
            text: '#81ecff',
            bg: 'rgba(129, 236, 255, 0.1)',
            label: 'Mastered / Stretch Zone'
        };
    };

    // Fit nodes based on filter and search
    const filteredNodes = useMemo(() => {
        return NODES.filter(node => {
            const matchesSubject = selectedSubject === 'all' || node.subject === selectedSubject;
            const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  node.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSubject && matchesSearch;
        });
    }, [selectedSubject, searchQuery]);

    const activeEdges = useMemo(() => {
        return EDGES.filter(edge => {
            const sourceExists = filteredNodes.some(n => n.id === edge.source);
            const targetExists = filteredNodes.some(n => n.id === edge.target);
            return sourceExists && targetExists;
        });
    }, [filteredNodes]);

    // Action when user wants to study a topic
    const handleRemediateTopic = (node: Node) => {
        if (node.type === 'core') {
            navigate(`/dashboard/test-center?mode=Quick_Test&difficulty=Exam_Level`);
        } else {
            // Remediate specific topic
            navigate(`/dashboard/mock?topic=${encodeURIComponent(node.label)}`);
        }
    };

    // Calculate rotation transformations
    const getTransformedCoords = (x: number, y: number) => {
        // Rotate around center (500, 450)
        const cx = 500;
        const cy = 450;
        const rad = (graphAngle * Math.PI) / 180;
        const dx = x - cx;
        const dy = y - cy;
        
        // Idle rotation
        const rx = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
        const ry = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;

        // Apply mouse-parallax shifts
        const px = rx + mouseOffset.x * 25;
        const py = ry + mouseOffset.y * 25;

        return { x: px, y: py };
    };

    const transformedNodes = useMemo(() => {
        return filteredNodes.map(node => {
            const { x, y } = getTransformedCoords(node.x, node.y);
            return {
                ...node,
                tx: x,
                ty: y
            };
        });
    }, [filteredNodes, graphAngle, mouseOffset]);

    const transformedEdges = useMemo(() => {
        return activeEdges.map(edge => {
            const source = transformedNodes.find(n => n.id === edge.source);
            const target = transformedNodes.find(n => n.id === edge.target);
            if (!source || !target) return null;
            return {
                ...edge,
                x1: source.tx,
                y1: source.ty,
                x2: target.tx,
                y2: target.ty
            };
        }).filter(Boolean);
    }, [activeEdges, transformedNodes]);

    return (
        <div className="w-full relative bg-gradient-to-b from-background to-black border border-white/5 p-6 rounded-[2.5rem] overflow-hidden shadow-2xl space-y-6">
            
            {/* Header controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                        <Crosshair className="text-primary animate-pulse" size={24} />
                        Visual Knowledge Graph
                    </h3>
                    <p className="text-xs text-text-muted">
                        Explore your real-time ELO vectors, conceptual strength, and subject synergy models.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search bar */}
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Find concept..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-48 bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-text-main focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                        {(['all', 'physics', 'chemistry', 'math'] as const).map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubject(sub)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    selectedSubject === sub
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-text-muted hover:text-text-main'
                                }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 3D SVG Network Viewport */}
                <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="col-span-2 relative aspect-square md:aspect-[4/3] bg-black/40 border border-white/5 rounded-3xl overflow-hidden group shadow-inner select-none"
                    style={{
                        perspective: 1200,
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                >
                    {/* Perspective ambient grid backing */}
                    <div 
                        className="absolute inset-0 opacity-15 pointer-events-none transition-transform duration-300 ease-out"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                            transform: `perspective(1000px) rotateX(${mouseOffset.y * 6}deg) rotateY(${mouseOffset.x * 6}deg) scale(1.05)`
                        }}
                    />

                    {/* Dynamic Vector SVG */}
                    <svg 
                        viewBox="100 100 800 600" 
                        className="w-full h-full select-none"
                    >
                        <defs>
                            {/* Neon glows */}
                            <filter id="glow-physics" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="glow-chemistry" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="glow-math" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            
                            {/* Gradients */}
                            <linearGradient id="grad-physics" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                            </linearGradient>
                            <linearGradient id="grad-chemistry" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#81ecff" stopOpacity="0.8" />
                            </linearGradient>
                            <linearGradient id="grad-math" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                            </linearGradient>
                        </defs>

                        {/* Pan & Zoom Group Wrapper */}
                        <g
                            style={{
                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                                transformOrigin: '500px 450px',
                                transition: isDragging || isZooming ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            {/* Conduit Edge Connections */}
                            {transformedEdges.map((edge, idx) => {
                                if (!edge) return null;
                                const isDisciplinary = edge.subject === 'physics' && edge.target.startsWith('chem') ||
                                                       edge.subject === 'chemistry' && edge.target.startsWith('phy') ||
                                                       edge.subject === 'physics' && edge.source.startsWith('math');

                                return (
                                    <g key={idx}>
                                        {/* Ambient background glow path */}
                                        <line
                                            x1={edge.x1}
                                            y1={edge.y1}
                                            x2={edge.x2}
                                            y2={edge.y2}
                                            stroke={edge.subject === 'physics' ? '#ff3b3b' : edge.subject === 'chemistry' ? '#10b981' : '#3b82f6'}
                                            strokeOpacity={tier === 'low' ? 0.02 : (isDisciplinary ? 0.15 : 0.08)}
                                            strokeWidth={isDisciplinary ? 3 : 5}
                                        />
                                        {/* Dynamic flow line */}
                                        <line
                                            x1={edge.x1}
                                            y1={edge.y1}
                                            x2={edge.x2}
                                            y2={edge.y2}
                                            stroke={edge.subject === 'physics' ? '#ff6b6b' : edge.subject === 'chemistry' ? '#34d399' : '#60a5fa'}
                                            strokeWidth={isDisciplinary ? 1.5 : 2}
                                            strokeOpacity={tier === 'low' ? 0 : (isDisciplinary ? 0.7 : 0.4)}
                                            strokeDasharray={tier === 'low' ? undefined : (isDisciplinary ? "8, 12" : "15, 20")}
                                            className={tier === 'low' ? '' : 'animate-dash'}
                                            style={{
                                                animationDuration: tier === 'balanced' ? (isDisciplinary ? '8s' : '16s') : (isDisciplinary ? '4s' : '8s')
                                            }}
                                        />
                                    </g>
                                );
                            })}

                            {/* Nodes */}
                            {transformedNodes.map((node) => {
                                const rating = getNodeRating(node);
                                const ratingStyle = getRatingColor(rating);
                                const isCore = node.type === 'core';
                                const isSelected = selectedNode?.id === node.id;
                                const isHovered = hoveredNode?.id === node.id;

                                // Scale factors
                                const size = isCore ? 28 : 14;
                                const scale = isHovered ? 1.3 : isSelected ? 1.15 : 1.0;

                                return (
                                    <g
                                        key={node.id}
                                        className="cursor-pointer"
                                        onClick={() => setSelectedNode(node)}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                    >
                                        {/* Active halo glow for hover or selection */}
                                        {(isSelected || isHovered) && (
                                            <circle
                                                cx={node.tx}
                                                cy={node.ty}
                                                r={(size + 8) * scale}
                                                fill="none"
                                                stroke={ratingStyle.stroke}
                                                strokeWidth={2}
                                                strokeDasharray="4, 4"
                                                className="animate-spin"
                                                style={{ 
                                                    transformOrigin: 'center',
                                                    transformBox: 'fill-box',
                                                    animationDuration: '10s' 
                                                }}
                                            />
                                        )}

                                        {/* Node centroid glow - adaptive hardware accelerated or dynamic SVG filter */}
                                        <circle
                                            cx={node.tx}
                                            cy={node.ty}
                                            r={size * scale * 1.5}
                                            fill={ratingStyle.stroke}
                                            fillOpacity={tier === 'low' ? 0.04 : (isMobile || tier === 'balanced' ? 0.28 : 0.15)}
                                            filter={tier === 'low' || tier === 'balanced' || isMobile ? undefined : `url(#glow-${node.subject})`}
                                            style={{ transition: 'r 0.3s ease, fill-opacity 0.3s ease' }}
                                        />

                                        {/* Base node circle */}
                                        <circle
                                            cx={node.tx}
                                            cy={node.ty}
                                            r={size * scale}
                                            fill={isCore ? '#121214' : ratingStyle.bg}
                                            stroke={ratingStyle.stroke}
                                            strokeWidth={isCore ? 3 : 2}
                                            style={{ transition: 'r 0.3s ease, fill 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease' }}
                                        />

                                        {/* Tiny inner center for cores */}
                                        {isCore && (
                                            <circle
                                                cx={node.tx}
                                                cy={node.ty}
                                                r={10 * scale}
                                                fill={ratingStyle.stroke}
                                            />
                                        )}

                                        {/* Label text */}
                                        <text
                                            x={node.tx}
                                            y={node.ty + (isCore ? size + 16 : size + 14)}
                                            textAnchor="middle"
                                            fill={isHovered || isSelected ? '#ffffff' : '#a1a1aa'}
                                            fontSize={isCore ? '12px' : '10px'}
                                            fontWeight={isCore || isSelected ? 'bold' : 'normal'}
                                            className="pointer-events-none select-none transition-colors"
                                        >
                                            {node.label}
                                        </text>
                                        
                                        {/* Floating rating badge on hover */}
                                        {isHovered && (
                                            <g className="pointer-events-none">
                                                <rect
                                                    x={node.tx - 25}
                                                    y={node.ty - (size + 24)}
                                                    width={50}
                                                    height={18}
                                                    rx={4}
                                                    fill="#1e1e24"
                                                    stroke={ratingStyle.stroke}
                                                    strokeWidth={1}
                                                />
                                                <text
                                                    x={node.tx}
                                                    y={node.ty - (size + 11)}
                                                    textAnchor="middle"
                                                    fill={ratingStyle.text}
                                                    fontSize="9px"
                                                    fontWeight="bold"
                                                >
                                                    {Math.round(rating)}
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                    
                    {/* Floating HUD zoom controls */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-black/60 border border-white/10 p-1.5 rounded-2xl z-20 backdrop-blur-md">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                recordInteraction();
                                setZoomScale(prev => Math.min(3.0, prev + 0.2));
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/15 active:scale-90 rounded-xl text-white text-lg font-bold transition-all"
                            title="Zoom In"
                        >
                            +
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                recordInteraction();
                                setZoomScale(prev => Math.max(0.5, prev - 0.2));
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/15 active:scale-90 rounded-xl text-white text-lg font-bold transition-all"
                            title="Zoom Out"
                        >
                            −
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                recordInteraction();
                                setPanOffset({ x: 0, y: 0 });
                                setZoomScale(1);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/15 active:scale-90 rounded-xl text-white transition-all"
                            title="Reset Position"
                        >
                            <Crosshair size={14} />
                        </button>
                    </div>

                    {/* Auto rotate control toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setAutoRotate(!autoRotate);
                        }}
                        className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-text-muted hover:text-text-main transition-colors uppercase tracking-widest"
                    >
                        {autoRotate ? '⏸ Pause Orbit' : '▶ Play Orbit'}
                    </button>

                    {/* Drag & Zoom tutorial indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-text-muted select-none">
                        <Sparkles size={12} className="text-primary animate-pulse" />
                        Drag to Pan • Pinch/Scroll to Zoom
                    </div>
                </div>

                {/* 3D HUD Side Panel */}
                <div className="glass-card p-6 flex flex-col justify-between space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedNode ? (
                            <motion.div
                                key={selectedNode.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                                            {selectedNode.subject} {selectedNode.type === 'core' ? 'CENTROID' : 'TOPIC'}
                                        </span>
                                        <Award 
                                            size={20} 
                                            className={getNodeRating(selectedNode) > 1150 ? 'text-[#81ecff]' : 'text-text-muted'} 
                                        />
                                    </div>
                                    <h4 className="text-2xl font-black text-text-main leading-tight">{selectedNode.label}</h4>
                                    <p className="text-xs text-text-muted leading-relaxed">{selectedNode.description}</p>
                                </div>

                                <div className="border-t border-white/10 pt-4 space-y-4">
                                    {/* ELO Vector Gauge */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-text-muted">ELO Ability Estimate</span>
                                            <span style={{ color: getRatingColor(getNodeRating(selectedNode)).text }} className="font-bold font-mono">
                                                {Math.round(getNodeRating(selectedNode))}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, Math.max(10, ((getNodeRating(selectedNode) - 500) / 1000) * 100))}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                style={{ backgroundColor: getRatingColor(getNodeRating(selectedNode)).text }}
                                                className="h-full rounded-full shadow-[0_0_10px_currentColor]"
                                            />
                                        </div>
                                    </div>

                                    {/* Performance Class Label */}
                                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                                        <Zap size={16} style={{ color: getRatingColor(getNodeRating(selectedNode)).text }} />
                                        <div className="text-left">
                                            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Mastery Band</div>
                                            <div style={{ color: getRatingColor(getNodeRating(selectedNode)).text }} className="text-xs font-bold">
                                                {getRatingColor(getNodeRating(selectedNode)).label}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ELO Calibration Confidence */}
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-muted">Calibration Rigidity</span>
                                        <span className="text-text-main font-semibold">
                                            {calibration ? (calibration.totalAttempts > 50 ? 'High (Stability 98%)' : calibration.totalAttempts > 15 ? 'Medium (Stability 74%)' : 'Low (Stabilizing...)') : 'None'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center text-text-muted text-sm italic">
                                Click on any concept in the network to inspect your cognitive ELO vectors!
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <div className="space-y-3 pt-6 border-t border-white/10">
                        <button
                            onClick={() => selectedNode && handleRemediateTopic(selectedNode)}
                            disabled={!selectedNode}
                            className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:brightness-110 active:scale-95 text-white font-extrabold rounded-2xl transition-all shadow-[0_0_20px_rgba(129,236,255,0.15)] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                        >
                            <Crosshair size={14} />
                            Adaptive Concept Test
                        </button>
                        
                        <p className="text-[10px] text-text-muted text-center leading-normal">
                            Clicking launches a tailored Mock Exam splicing remediation questions targeted exactly for your {selectedNode ? selectedNode.label : 'selected'} vector.
                        </p>
                    </div>

                </div>

            </div>

            {/* Injected Synergy flows */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-3xl flex flex-col md:flex-row items-center gap-4 text-sm text-text-muted leading-relaxed">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <span className="text-text-main font-bold">Concept Synergy Conduit Mapping:</span> The connecting paths represent inter-disciplinary dependencies. For instance, high calculus proficiency accelerates Newton's mechanics mastery, while modern physical chemistry depends strictly on chemical bonding vectors.
                </div>
            </div>

            {/* Custom Animations for SVGs */}
            <style>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -100;
                    }
                }
                .animate-dash {
                    stroke-dasharray: 8, 12;
                    animation: dash 10s linear infinite;
                }
            `}</style>
        </div>
    );
};

import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';
import { SITE_URL } from '../../lib/siteConfig';
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { 
    Terminal, 
    Instagram, 
    Twitter, 
    Linkedin, 
    BookOpen, 
    Cpu, 
    Compass, 
    Flame, 
    Sparkles, 
    CornerDownLeft, 
    Share2, 
    ArrowUpRight, 
    ChevronRight,
    Github,
    Activity
} from 'lucide-react';

// ─── 3D INTERACTIVE PARTICLE FIELD (R3F) ───
const ParticleCloud = ({ scrollYProgress, tier }: { scrollYProgress: any; tier: string }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const count = tier === 'balanced' ? 1200 : 2500;
    const positions = useRef<Float32Array | null>(null);

    if (!positions.current) {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Generate elegant particle distribution inside a double-helix or spherical shell
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            
            // Adding orbital bands
            const r = 2.4 + Math.random() * 0.8 + (Math.sin(theta * 3) * 0.2); 
            arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            arr[i * 3 + 2] = r * Math.cos(phi);
        }
        positions.current = arr;
    }

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const scroll 
<truncated 42800 bytes
import { Canvas, useThree } from '@react-three/fiber';
import { Component, Suspense, useState, useEffect, useRef, type ReactNode } from 'react';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Model } from './Model';
import * as THREE from 'three';
import { Plus, Minus, ChevronUp, ChevronDown, User } from 'lucide-react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: any) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: any) { console.error("Avatar Error:", error); }
    render() {
        if (this.state.hasError) return (
            <div className="flex flex-col items-center justify-center w-full h-full text-text-muted bg-slate-900/50 rounded-full border border-white/5">
                <User size={48} className="opacity-20 mb-2" />
                <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40">System Idle</span>
            </div>
        );
        return this.props.children;
    }
}

interface CameraState {
    position: [number, number, number];
    target: [number, number, number];
}

const INITIAL_STATE: CameraState = {
    position: [0, 1.4, 3.8],
    target: [0, 1.2, 0]
};

const CameraController = ({ state }: { state: CameraState }) => {
    const { camera } = useThree();
    useEffect(() => {
        camera.position.set(...state.position);
        camera.lookAt(...state.target);
        camera.updateProjectionMatrix();
    }, [state, camera]);
    return null;
};

export const AvatarCanvas = ({ emotion }: { emotion: string }) => {
    const [cameraState, setCameraState] = useState<CameraState>(INITIAL_STATE);
    const [shouldRender, setShouldRender] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Optimization 1: Intersection Observer to pause rendering when off-screen
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.1 }
        );

        if (containerRef.current) observer.observe(containerRef.current);

        // Optimization 2: Defer initialization until thread is idle
        const handle = (window.requestIdleCallback || ((cb) => setTimeout(cb, 500)))(() => {
            setShouldRender(true);
        });

        return () => {
            observer.disconnect();
            if (window.cancelIdleCallback) window.cancelIdleCallback(handle as number);
            else clearTimeout(handle as any);
        };
    }, []);

    const moveCamera = (yDelta: number) => {
        setCameraState(prev => ({
            ...prev,
            position: [prev.position[0], prev.position[1] + yDelta, prev.position[2]],
            target: [prev.target[0], prev.target[1] + (yDelta * 0.5), prev.target[2]]
        }));
    };

    const zoomCamera = (delta: number) => {
        setCameraState(prev => {
            const newZ = Math.max(1.2, Math.min(10.0, prev.position[2] + delta));
            return {
                ...prev,
                position: [prev.position[0], prev.position[1], newZ]
            };
        });
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div ref={containerRef} className="w-full h-full relative flex items-center justify-center overflow-visible">

            {/* CAMERA CONTROLS */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 w-max pointer-events-auto">
                <div className="flex items-center gap-1 p-0.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); moveCamera(0.2); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                        <ChevronUp size={16} />
                    </button>
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); moveCamera(-0.2); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-1 p-0.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); zoomCamera(-0.5); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); zoomCamera(0.5); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                        <Minus size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* THE CIRCLE VIEWPORT */}
            <div className="w-full h-full aspect-square rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-purple-900/10 border-4 border-white/10 shadow-2xl relative z-10 pointer-events-auto flex items-center justify-center">
                {(!shouldRender || !isInView) ? (
                    <div className="flex flex-col items-center justify-center text-primary/40 animate-pulse">
                        <User size={64} strokeWidth={1} />
                        <span className="text-[10px] mt-2 font-bold tracking-widest uppercase">Initializing AI</span>
                    </div>
                ) : (
                    <ErrorBoundary>
                        <Canvas
                            shadows={!isMobile} 
                            camera={{ fov: 35 }}
                            dpr={isMobile ? 1 : Math.min(1.5, window.devicePixelRatio)}
                            gl={{
                                antialias: !isMobile,
                                powerPreference: 'high-performance',
                                alpha: true,
                                preserveDrawingBuffer: false,
                                stencil: false,
                                depth: true
                            }}
                            style={{ background: 'transparent' }}
                            frameloop={isInView ? 'always' : 'never'}
                        >
                            <CameraController state={cameraState} />
                            <ambientLight intensity={1.5} />
                            <directionalLight position={[5, 12, 5]} intensity={1.2} castShadow={!isMobile} />
                            <pointLight position={[-5, 5, -5]} intensity={0.5} />
                            {!isMobile && <gridHelper args={[20, 20, 0x444444, 0x222222]} />}
                            {!isMobile && <Environment preset="city" />}
                            <Suspense fallback={null}>
                                <group position={[0, 0, 0]}>
                                    <group scale={1.8}>
                                        <Model emotion={emotion} />
                                    </group>
                                </group>
                                {!isMobile && <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={8} blur={2.5} far={1} />}
                            </Suspense>
                            <OrbitControls
                                target={new THREE.Vector3(...cameraState.target)}
                                enablePan={!isMobile}
                                enableZoom={true}
                                minDistance={0.5}
                                maxDistance={12}
                                makeDefault
                            />
                        </Canvas>
                    </ErrorBoundary>
                )}
            </div>
        </div>
    );
};

import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Environment, Float, ContactShadows, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Standing on the ground (y=0 in scene, model base at y= -0.8 in primitive)
  return <primitive object={scene} scale={2.2} position={[0, -2.1, 0]} rotation={[0, -0.2, 0]} />;
}

function CameraController({ zoom, tilt }: { zoom: number, tilt: number }) {
    const { camera } = useThree();
    
    useEffect(() => {
        // Handle Zoom (Camera Z position)
        // Default is 6. Range: 4 (close) to 10 (far)
        const targetZ = 6 - (zoom - 1) * 3;
        // eslint-disable-next-line react-hooks/immutability
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
        
        // Handle Tilt (Camera Y position)
        // Default is 0. Range: -2 to 4
        const targetY = (tilt - 1) * 3;
         
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1);
        
        camera.lookAt(0, 0, 0);
    }, [zoom, tilt, camera]);

    return null;
}

interface FurinaAvatarProps {
    zoom?: number;
    tilt?: number;
}

export const FurinaAvatar: React.FC<FurinaAvatarProps> = ({ zoom = 1, tilt = 1 }) => {
    return (
        <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />
                
                <Suspense fallback={null}>
                    <CameraController zoom={zoom} tilt={tilt} />
                    <OrbitControls 
                        enablePan={false}
                        minDistance={3}
                        maxDistance={12}
                        maxPolarAngle={Math.PI / 1.5}
                        minPolarAngle={Math.PI / 3}
                    />

                    {/* Grid on the ground */}
                    <Grid 
                        position={[0, -2.1, 0]}
                        infiniteGrid
                        fadeDistance={20}
                        fadeStrength={5}
                        cellSize={0.5}
                        sectionSize={2.5}
                        sectionColor="#4f46e5"
                        cellColor="#312e81"
                        sectionThickness={1}
                    />

                    <Float 
                        speed={1} 
                        rotationIntensity={0.2} 
                        floatIntensity={0.2}
                        floatingRange={[-0.05, 0.05]}
                    >
                        <Model url="/models/furina.glb" />
                    </Float>
                    
                    <Environment preset="city" />
                    <ContactShadows 
                        position={[0, -2.1, 0]} 
                        opacity={0.6} 
                        scale={5} 
                        blur={2} 
                        far={4} 
                    />
                </Suspense>
            </Canvas>
            
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0d0f14] via-transparent to-transparent opacity-80" />
        </div>
    );
};

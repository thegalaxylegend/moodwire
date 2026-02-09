import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Model URL
const MODEL_URL = "/models/furina.glb";

export const Model = ({ emotion }: { emotion: string }) => {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(MODEL_URL);
    const { actions } = useAnimations(animations, group);

    // Bone References (Reference-Matched Mapping)
    const bones = useRef<{
        Hips?: THREE.Bone;
        Spine?: THREE.Bone;
        LeftShoulder?: THREE.Bone;
        RightShoulder?: THREE.Bone;
        LeftArm?: THREE.Bone;
        RightArm?: THREE.Bone;
        LeftElbow?: THREE.Bone;
        RightElbow?: THREE.Bone;
        LeftWrist?: THREE.Bone;
        RightWrist?: THREE.Bone;
        LeftLeg?: THREE.Bone;
        RightLeg?: THREE.Bone;
    }>({});

    const meshRefs = useRef<THREE.Mesh[]>([]);
    const blinkState = useRef({ timer: 0, nextBlink: 3, isBlinking: false });
    const initialRotations = useRef<{ [key: string]: THREE.Euler }>({});

    // 1. Initial Setup: Deep Traversal & Bone Mapping
    useEffect(() => {
        console.log("--- BONE & MESH CALIBRATION: 1:1 MATCH ---");
        meshRefs.current = [];

        scene.traverse((child) => {
            // Find ALL mesh parts with morphs
            if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
                if (child.morphTargetInfluences) {
                    meshRefs.current.push(child);
                    if (child.morphTargetDictionary) {
                        console.log(`%c Found Morphs on: ${child.name}`, "color: #3498db; font-weight: bold;");
                    }
                }
            }

            // Map bones once
            if (child instanceof THREE.Bone) {
                const n = child.name.toLowerCase();
                initialRotations.current[child.name] = child.rotation.clone();

                if (n.includes('hips')) bones.current.Hips = child;
                else if (n.includes('spine_03')) bones.current.Spine = child;

                // Shoulders
                else if (n.includes('left_shoulder') || n.includes('left_clavicle')) bones.current.LeftShoulder = child;
                else if (n.includes('right_shoulder') || n.includes('right_clavicle')) bones.current.RightShoulder = child;

                // Arms
                else if (n.includes('left_arm') && !n.includes('twist')) bones.current.LeftArm = child;
                else if (n.includes('right_arm') && !n.includes('twist')) bones.current.RightArm = child;
                else if (n.includes('left_elbow') || (n.includes('left_arm') && n.includes('061'))) bones.current.LeftElbow = child;
                else if (n.includes('right_elbow') || (n.includes('right_arm') && n.includes('061'))) bones.current.RightElbow = child;
                else if (n.includes('left_wrist') || (n.includes('left_arm') && n.includes('063'))) bones.current.LeftWrist = child;
                else if (n.includes('right_wrist') || (n.includes('right_arm') && n.includes('063'))) bones.current.RightWrist = child;

                // Legs
                else if (n.includes('left_leg')) bones.current.LeftLeg = child;
                else if (n.includes('right_leg')) bones.current.RightLeg = child;
            }
        });

        if (actions) {
            const idleName = Object.keys(actions).find(n => n.toLowerCase().includes('idle')) || Object.keys(actions)[0];
            if (idleName) actions[idleName]?.reset().fadeIn(0.5).play();
        }
    }, [scene, actions]);

    // 2. ANIMATION LOOP (1:1 ART MATCH)
    useFrame((state, delta) => {
        if (!group.current) return;

        const time = state.clock.elapsedTime;
        const lowEmotion = (emotion || 'neutral').toLowerCase();
        const isTalking = lowEmotion === 'speaking' || lowEmotion === 'talking';

        // --- A. BLINK LOGIC ---
        blinkState.current.timer += delta;
        if (blinkState.current.timer > blinkState.current.nextBlink) {
            blinkState.current.isBlinking = true;
            if (blinkState.current.timer > blinkState.current.nextBlink + 0.15) {
                blinkState.current.isBlinking = false;
                blinkState.current.timer = 0;
                blinkState.current.nextBlink = Math.random() * 4 + 2;
            }
        }

        // --- B. POSTURE: EMERGENCY RESET (STRAIGHT & SAFE) ---
        const LERP_SPEED = 0.1;

        // 1. PELVIS & TORSO (Perfectly Straight)
        if (bones.current.Hips) {
            const b = initialRotations.current[bones.current.Hips.name];
            bones.current.Hips.rotation.z = THREE.MathUtils.lerp(bones.current.Hips.rotation.z, b.z, LERP_SPEED);
            bones.current.Hips.rotation.x = THREE.MathUtils.lerp(bones.current.Hips.rotation.x, b.x, LERP_SPEED); // ZERO Tilt
        }
        if (bones.current.Spine) {
            const b = initialRotations.current[bones.current.Spine.name];
            bones.current.Spine.rotation.x = THREE.MathUtils.lerp(bones.current.Spine.rotation.x, b.x, LERP_SPEED); // ZERO Lean
        }

        // 2. SHOULDERS (Neutral)
        if (bones.current.LeftShoulder) {
            const b = initialRotations.current[bones.current.LeftShoulder.name];
            bones.current.LeftShoulder.rotation.z = THREE.MathUtils.lerp(bones.current.LeftShoulder.rotation.z, b.z + 0.05, LERP_SPEED); // Slight natural drop
            bones.current.LeftShoulder.rotation.x = THREE.MathUtils.lerp(bones.current.LeftShoulder.rotation.x, b.x, LERP_SPEED); // Recenter
        }
        if (bones.current.RightShoulder) {
            const b = initialRotations.current[bones.current.RightShoulder.name];
            bones.current.RightShoulder.rotation.z = THREE.MathUtils.lerp(bones.current.RightShoulder.rotation.z, b.z - 0.05, LERP_SPEED); // Slight natural drop
            bones.current.RightShoulder.rotation.x = THREE.MathUtils.lerp(bones.current.RightShoulder.rotation.x, b.x, LERP_SPEED); // Recenter
        }

        // 3. ARMS & HANDS (Axis Correction)
        let armZ = 20;    // Safe "A-Pose" gap
        let armX = 0;     // RESET TWIST (Was causing crossing)
        let armY = 15;    // NEW SWING (Move hands forward via Y-axis)
        let elbowX = -10; // Natural soft bend
        let wristX = 0;   // Neutral
        let wristY = 0;   // Neutral

        if (isTalking) {
            armZ -= 5 * (Math.sin(time * 3) * 0.5 + 0.5);
            elbowX -= 5 * (Math.abs(Math.sin(time * 4)));
        }

        // Apply RIGHT
        if (bones.current.RightArm) {
            const b = initialRotations.current[bones.current.RightArm.name];
            bones.current.RightArm.rotation.z = THREE.MathUtils.lerp(bones.current.RightArm.rotation.z, b.z + THREE.MathUtils.degToRad(-armZ), LERP_SPEED);
            bones.current.RightArm.rotation.x = THREE.MathUtils.lerp(bones.current.RightArm.rotation.x, b.x + THREE.MathUtils.degToRad(armX), LERP_SPEED);
            bones.current.RightArm.rotation.y = THREE.MathUtils.lerp(bones.current.RightArm.rotation.y, b.y + THREE.MathUtils.degToRad(armY), LERP_SPEED); // Forward Swing
        }
        if (bones.current.RightElbow) {
            const b = initialRotations.current[bones.current.RightElbow.name];
            bones.current.RightElbow.rotation.x = THREE.MathUtils.lerp(bones.current.RightElbow.rotation.x, b.x + THREE.MathUtils.degToRad(elbowX), LERP_SPEED);
        }
        if (bones.current.RightWrist) {
            const b = initialRotations.current[bones.current.RightWrist.name];
            bones.current.RightWrist.rotation.x = THREE.MathUtils.lerp(bones.current.RightWrist.rotation.x, b.x + THREE.MathUtils.degToRad(wristX), LERP_SPEED);
            bones.current.RightWrist.rotation.y = THREE.MathUtils.lerp(bones.current.RightWrist.rotation.y, b.y + THREE.MathUtils.degToRad(wristY), LERP_SPEED);
        }

        // Apply LEFT
        if (bones.current.LeftArm) {
            const b = initialRotations.current[bones.current.LeftArm.name];
            bones.current.LeftArm.rotation.z = THREE.MathUtils.lerp(bones.current.LeftArm.rotation.z, b.z + THREE.MathUtils.degToRad(armZ), LERP_SPEED);
            bones.current.LeftArm.rotation.x = THREE.MathUtils.lerp(bones.current.LeftArm.rotation.x, b.x + THREE.MathUtils.degToRad(armX), LERP_SPEED);
            bones.current.LeftArm.rotation.y = THREE.MathUtils.lerp(bones.current.LeftArm.rotation.y, b.y + THREE.MathUtils.degToRad(-armY), LERP_SPEED); // Forward Swing (Inverse for Left)
        }
        if (bones.current.LeftElbow) {
            const b = initialRotations.current[bones.current.LeftElbow.name];
            bones.current.LeftElbow.rotation.x = THREE.MathUtils.lerp(bones.current.LeftElbow.rotation.x, b.x + THREE.MathUtils.degToRad(elbowX), LERP_SPEED);
        }
        if (bones.current.LeftWrist) {
            const b = initialRotations.current[bones.current.LeftWrist.name];
            bones.current.LeftWrist.rotation.x = THREE.MathUtils.lerp(bones.current.LeftWrist.rotation.x, b.x + THREE.MathUtils.degToRad(wristX), LERP_SPEED);
            bones.current.LeftWrist.rotation.y = THREE.MathUtils.lerp(bones.current.LeftWrist.rotation.y, b.y + THREE.MathUtils.degToRad(-wristY), LERP_SPEED);
        }

        // 4. LEGS (Straight Reset)
        if (bones.current.LeftLeg && bones.current.RightLeg) {
            const lb = initialRotations.current[bones.current.LeftLeg.name];
            const rb = initialRotations.current[bones.current.RightLeg.name];

            bones.current.LeftLeg.rotation.x = THREE.MathUtils.lerp(bones.current.LeftLeg.rotation.x, lb.x, LERP_SPEED);
            bones.current.RightLeg.rotation.x = THREE.MathUtils.lerp(bones.current.RightLeg.rotation.x, rb.x, LERP_SPEED);
            bones.current.LeftLeg.rotation.z = THREE.MathUtils.lerp(bones.current.LeftLeg.rotation.z, lb.z, LERP_SPEED);
            bones.current.RightLeg.rotation.z = THREE.MathUtils.lerp(bones.current.RightLeg.rotation.z, rb.z, LERP_SPEED);
        }

        // --- C. MORPH TARGETS (BLINK & MOUTH) ---
        meshRefs.current.forEach((mesh) => {
            const dict = mesh.morphTargetDictionary;
            const influences = mesh.morphTargetInfluences;
            if (!influences) return;

            const setM = (key: string, val: number, spd = 0.2) => {
                const idx = dict ? dict[key] : undefined;
                if (idx !== undefined) {
                    influences[idx] = THREE.MathUtils.lerp(influences[idx], val, spd);
                }
            };

            // Speech (Mouth)
            if (isTalking) {
                const speech = Math.sin(time * 18) * 0.5 + 0.3;
                setM('mouthOpen', speech, 0.4);
                setM('MouthOpen', speech, 0.4);
                setM('Mouth_Open', speech, 0.4);
            } else {
                setM('mouthOpen', 0, 0.2);
                setM('MouthOpen', 0, 0.2);
            }

            // Blinking (Comprehensive Search)
            const bVal = blinkState.current.isBlinking ? 1 : 0;
            const bKeys = ['blink', 'EyeBlink', 'Eye_Close', 'Eyelid_Close', 'EyeBlink_L', 'EyeBlink_R', 'Blink_L', 'Blink_R', 'Eyes_Close'];
            bKeys.forEach(k => setM(k, bVal, 0.8));
        });
    });

    return (
        <group ref={group} dispose={null}>
            <primitive object={scene} />
        </group>
    );
};

useGLTF.preload(MODEL_URL);

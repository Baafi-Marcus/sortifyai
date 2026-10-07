import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';

const GlassShape = ({ position, rotation, scale, type }) => {
  const mesh = useRef();

  useFrame((state, delta) => {
    mesh.current.rotation.x += delta * 0.15;
    mesh.current.rotation.y += delta * 0.2;
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={position}>
      <mesh ref={mesh} rotation={rotation} scale={scale}>
        {type === 'torus' && <torusGeometry args={[1, 0.4, 16, 32]} />}
        {type === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
        {type === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        
        {/* Fast Physical Glass Material */}
        <meshPhysicalMaterial 
          transmission={1}
          transparent
          roughness={0.15}
          thickness={1.5}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          attenuationDistance={1}
          attenuationColor="#22d3ee" // Cyan tint to match branding
          color="#ffffff"
        />
      </mesh>
    </Float>
  );
};

export const GlassGeometryBackground = () => {
  return (
    <div className="w-full h-full fixed inset-0 z-[0] pointer-events-none bg-slate-950">
      {/* Fallback grainy noise texture for depth */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-[1]"></div>
      
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
        <directionalLight position={[-10, -10, -10]} intensity={1} color="#06b6d4" />
        
        <GlassShape type="icosahedron" position={[-5, 3, -2]} scale={1.2} rotation={[0.5, 0.2, 0]} />
        <GlassShape type="torus" position={[5, -2, -3]} scale={1.4} rotation={[Math.PI / 4, 0, 0.5]} />
        <GlassShape type="octahedron" position={[-3, -3, 1]} scale={0.9} rotation={[0, Math.PI / 3, 0]} />
        <GlassShape type="sphere" position={[4, 4, -4]} scale={1.1} rotation={[0, 0, 0]} />
        <GlassShape type="icosahedron" position={[0, -1, -6]} scale={2.5} rotation={[0, 0, 0]} />

        {/* Provides the reflections for the glass material */}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

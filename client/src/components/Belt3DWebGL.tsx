import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

export type BeltColor = 
  | 'white' 
  | 'yellow' 
  | 'orange' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'brown' 
  | 'black';

interface Belt3DWebGLProps {
  color: BeltColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  interactive?: boolean;
  showLabel?: boolean;
  autoRotate?: boolean;
  className?: string;
}

// Configuração de cores para cada faixa
const BELT_COLORS_3D: Record<BeltColor, { 
  color: string; 
  emissive: string;
  metalness: number;
  roughness: number;
}> = {
  white: { color: '#FFFFFF', emissive: '#E0E0E0', metalness: 0.1, roughness: 0.7 },
  yellow: { color: '#FFD700', emissive: '#FFA500', metalness: 0.3, roughness: 0.5 },
  orange: { color: '#FF8C00', emissive: '#FF6B00', metalness: 0.3, roughness: 0.5 },
  green: { color: '#22C55E', emissive: '#16A34A', metalness: 0.2, roughness: 0.6 },
  blue: { color: '#3B82F6', emissive: '#2563EB', metalness: 0.2, roughness: 0.6 },
  purple: { color: '#8B5CF6', emissive: '#7C3AED', metalness: 0.3, roughness: 0.5 },
  brown: { color: '#A16207', emissive: '#854D0E', metalness: 0.2, roughness: 0.7 },
  black: { color: '#1A1A1A', emissive: '#FFD700', metalness: 0.8, roughness: 0.3 }
};

const BELT_LABELS: Record<BeltColor, string> = {
  white: 'Faixa Branca',
  yellow: 'Faixa Amarela',
  orange: 'Faixa Laranja',
  green: 'Faixa Verde',
  blue: 'Faixa Azul',
  purple: 'Faixa Roxa',
  brown: 'Faixa Marrom',
  black: 'Faixa Preta'
};

const SIZE_CONFIG = {
  sm: { width: 200, height: 150, scale: 0.6 },
  md: { width: 300, height: 200, scale: 0.8 },
  lg: { width: 400, height: 300, scale: 1.0 },
  xl: { width: 500, height: 400, scale: 1.2 }
};

// Componente de partículas 3D
function Particles({ color, count = 50 }: { color: string; count?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  });

  useFrame((state) => {
    if (!particlesRef.current) return;
    const time = state.clock.getElapsedTime();
    particlesRef.current.rotation.y = time * 0.1;
    
    // Animar opacidade das partículas
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.3 + Math.sin(time * 2) * 0.2;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Componente da faixa 3D
function Belt3DMesh({ 
  color, 
  animated, 
  scale 
}: { 
  color: BeltColor; 
  animated: boolean; 
  scale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const buckleRef = useRef<THREE.Mesh>(null);
  const config = BELT_COLORS_3D[color];

  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (animated) {
      const time = state.clock.getElapsedTime();
      // Rotação suave automática
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.3;
      meshRef.current.rotation.x = Math.cos(time * 0.3) * 0.1;
      
      // Pulsação sutil
      const pulse = 1 + Math.sin(time * 2) * 0.02;
      meshRef.current.scale.set(scale * pulse, scale * pulse, scale * pulse);
      
      // Animação da fivela
      if (buckleRef.current) {
        buckleRef.current.rotation.z = Math.sin(time * 3) * 0.1;
      }
    }
  });

  return (
    <group>
      {/* Corpo principal da faixa */}
      <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[2, 0.3, 16, 100]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={color === 'black' ? 0.3 : 0.1}
          metalness={config.metalness}
          roughness={config.roughness}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Fivela dourada */}
      <mesh ref={buckleRef} position={[0, 2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.4, 0.15]} />
        <meshStandardMaterial
          color={color === 'black' ? '#FFD700' : '#C0C0C0'}
          metalness={0.9}
          roughness={0.1}
          emissive={color === 'black' ? '#FFD700' : '#E0E0E0'}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Detalhe da fivela (buraco central) */}
      <mesh position={[0, 2, 0.08]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshStandardMaterial
          color="#1A1A1A"
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* Nós laterais da faixa */}
      <mesh position={[-2.3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusKnotGeometry args={[0.2, 0.08, 64, 8]} />
        <meshStandardMaterial
          color={config.color}
          metalness={config.metalness}
          roughness={config.roughness}
        />
      </mesh>
      <mesh position={[2.3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <torusKnotGeometry args={[0.2, 0.08, 64, 8]} />
        <meshStandardMaterial
          color={config.color}
          metalness={config.metalness}
          roughness={config.roughness}
        />
      </mesh>
    </group>
  );
}

// Componente de iluminação
function Lighting({ color }: { color: BeltColor }) {
  const config = BELT_COLORS_3D[color];
  
  return (
    <>
      {/* Luz ambiente suave */}
      <ambientLight intensity={0.4} />
      
      {/* Luz principal (key light) */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Luz de preenchimento (fill light) */}
      <directionalLight
        position={[-5, 3, -5]}
        intensity={0.5}
        color="#ffffff"
      />
      
      {/* Luz de destaque (rim light) */}
      <spotLight
        position={[0, 5, -5]}
        intensity={0.8}
        angle={0.6}
        penumbra={1}
        color={config.emissive}
        castShadow
      />
      
      {/* Luz de brilho para faixa preta */}
      {color === 'black' && (
        <pointLight
          position={[0, 2, 2]}
          intensity={1.5}
          distance={10}
          color="#FFD700"
        />
      )}
    </>
  );
}

// Componente principal
export function Belt3DWebGL({
  color,
  size = 'lg',
  animated = true,
  interactive = true,
  showLabel = true,
  autoRotate = false,
  className
}: Belt3DWebGLProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const config = BELT_COLORS_3D[color];

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Container do Canvas 3D */}
      <div
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: `0 10px 40px rgba(0,0,0,0.3), 0 0 20px ${config.emissive}40`
        }}
      >
        <Canvas
          shadows
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
          }}
        >
          <Suspense fallback={null}>
            {/* Câmera */}
            <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
            
            {/* Iluminação */}
            <Lighting color={color} />
            
            {/* Ambiente HDR */}
            <Environment preset="city" />
            
            {/* Faixa 3D */}
            <Belt3DMesh 
              color={color} 
              animated={animated} 
              scale={sizeConfig.scale} 
            />
            
            {/* Partículas */}
            {animated && <Particles color={config.emissive} count={80} />}
            
            {/* Controles de órbita */}
            {interactive && (
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate={autoRotate}
                autoRotateSpeed={2}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.5}
              />
            )}
          </Suspense>
        </Canvas>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <div 
            className="text-lg font-bold"
            style={{ color: config.color }}
          >
            {BELT_LABELS[color]}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Renderização WebGL 3D
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de loading
export function Belt3DWebGLSkeleton({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="animate-pulse bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl"
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white/50 text-sm">Carregando 3D...</div>
        </div>
      </div>
    </div>
  );
}

import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from '../../state/store'

// A real R3F portal scene: a torus gateway of light, a slow particle vortex and
// a drifting field of motes. Used as the live layer on the World Gate hero,
// composited over the painted backdrop. Pauses under reduced motion.

function PortalRing({ paused }: { paused: boolean }) {
  const ring = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (paused) return
    if (ring.current) ring.current.rotation.z += delta * 0.18
    if (ring2.current) ring2.current.rotation.z -= delta * 0.12
  })
  return (
    <group>
      <mesh ref={ring}>
        <torusGeometry args={[2.1, 0.035, 24, 160]} />
        <meshStandardMaterial
          color={'#74EBD5'}
          emissive={'#74EBD5'}
          emissiveIntensity={2.2}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh ref={ring2} scale={1.28}>
        <torusGeometry args={[2.1, 0.018, 20, 160]} />
        <meshStandardMaterial color={'#F4C95D'} emissive={'#F4C95D'} emissiveIntensity={1.8} roughness={0.4} />
      </mesh>
      <mesh scale={0.82}>
        <circleGeometry args={[2.1, 64]} />
        <meshBasicMaterial color={'#5C8DFF'} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Vortex({ paused }: { paused: boolean }) {
  const points = useRef<THREE.Points>(null)
  const count = 1400
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const t = Math.random()
      const angle = t * Math.PI * 12
      const radius = 0.3 + t * 3.4
      arr[i * 3] = Math.cos(angle) * radius
      arr[i * 3 + 1] = Math.sin(angle) * radius
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2.2
    }
    return arr
  }, [])
  useFrame((_, delta) => {
    if (paused || !points.current) return
    points.current.rotation.z += delta * 0.08
  })
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color={'#9bdcff'}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function MotionPortal({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion()
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 6.4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 4]} intensity={40} color={'#74EBD5'} />
        <pointLight position={[3, 2, 2]} intensity={20} color={'#F4C95D'} />
        <Suspense fallback={null}>
          <PortalRing paused={reduced} />
          <Vortex paused={reduced} />
        </Suspense>
      </Canvas>
    </div>
  )
}

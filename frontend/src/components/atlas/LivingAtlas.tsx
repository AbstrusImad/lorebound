import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CanonArtifact } from '../../types'
import { useReducedMotion } from '../../state/store'

// A living constellation of canon. Each accepted artifact is a glowing star;
// connections are drawn as faint threads of light. This is a real R3F scene
// driven by the world's artifacts. Selecting a node is handled by the overlay
// in the page; this scene is the atmospheric spatial layer.

const TYPE_COLOR: Record<string, string> = {
  Character: '#FF6B9A',
  Location: '#74EBD5',
  Relic: '#F4C95D',
  Creature: '#66E6A3',
  Faction: '#5C8DFF',
  Event: '#F4C95D',
  'Magic Rule': '#74EBD5',
  Technology: '#9EA7B8',
  Custom: '#F5EBDD'
}

function toVec(a: CanonArtifact): THREE.Vector3 {
  // Map normalized (0..1) atlas coords into a centered 3D field.
  const x = (a.x - 0.5) * 9
  const y = (0.5 - a.y) * 5.4
  const z = (((a.x * 31 + a.y * 17) % 1) - 0.5) * 2.4
  return new THREE.Vector3(x, y, z)
}

function StarField({ paused }: { paused: boolean }) {
  const points = useRef<THREE.Points>(null)
  const count = 900
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 22
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3
    }
    return arr
  }, [])
  useFrame((_, delta) => {
    if (paused || !points.current) return
    points.current.rotation.y += delta * 0.01
  })
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color={'#9EA7B8'} transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function Node({ pos, color, paused, delay }: { pos: THREE.Vector3; color: string; paused: boolean; delay: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (paused) return
    const t = state.clock.elapsedTime + delay
    if (mesh.current) mesh.current.position.y = pos.y + Math.sin(t * 0.8) * 0.12
    if (halo.current) {
      halo.current.position.copy(mesh.current ? mesh.current.position : pos)
      const s = 1 + Math.sin(t * 1.4) * 0.12
      halo.current.scale.setScalar(s)
    }
  })
  return (
    <group>
      <mesh ref={mesh} position={pos}>
        <icosahedronGeometry args={[0.16, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} roughness={0.3} />
      </mesh>
      <mesh ref={halo} position={pos}>
        <ringGeometry args={[0.24, 0.3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.34} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Connections({ artifacts }: { artifacts: CanonArtifact[] }) {
  const byId = useMemo(() => {
    const m = new Map<string, CanonArtifact>()
    artifacts.forEach((a) => m.set(a.artifactId, a))
    return m
  }, [artifacts])

  const segments = useMemo(() => {
    const pts: number[] = []
    artifacts.forEach((a) => {
      const from = toVec(a)
      a.connections.forEach((cid) => {
        const target = byId.get(cid)
        if (target) {
          const to = toVec(target)
          pts.push(from.x, from.y, from.z, to.x, to.y, to.z)
        }
      })
    })
    return new Float32Array(pts)
  }, [artifacts, byId])

  if (segments.length === 0) return null
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[segments, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={'#74EBD5'} transparent opacity={0.22} />
    </lineSegments>
  )
}

function Scene({ artifacts, paused }: { artifacts: CanonArtifact[]; paused: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (paused || !group.current) return
    // Gentle parallax sway.
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.16
  })
  return (
    <group ref={group}>
      <StarField paused={paused} />
      <Connections artifacts={artifacts} />
      {artifacts.map((a, i) => (
        <Node key={a.artifactId} pos={toVec(a)} color={TYPE_COLOR[a.type] || '#F5EBDD'} paused={paused} delay={i * 0.6} />
      ))}
    </group>
  )
}

export function LivingAtlas({ artifacts, className = '' }: { artifacts: CanonArtifact[]; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 9], fov: 52 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 0, 6]} intensity={30} color={'#5C8DFF'} />
        <Suspense fallback={null}>
          <Scene artifacts={artifacts} paused={reduced} />
        </Suspense>
      </Canvas>
    </div>
  )
}

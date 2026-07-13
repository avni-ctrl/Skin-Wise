import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

// The hero's living depth: a camera sinking through translucent skin strata
// while the DOM overlay (SkinDive.jsx) narrates each layer. Colors stay in
// the house palette; the animated background grade lives in the DOM behind
// this alpha canvas.

const LAYERS = [
  { y: -8, color: '#e8ddc8', spread: 11 },  // epidermis — warm cream keratin
  { y: -17, color: '#c9a227', spread: 12 }, // barrier — champagne lipid film
  { y: -26, color: '#7a9a82', spread: 13 }, // hydration — sage water table
  { y: -35, color: '#dfd6bd', spread: 13 }, // dermis — pale fibres on emerald
]

function Stratum({ y, color, spread, seed }) {
  const group = useRef()
  const discs = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        x: Math.sin(seed * 7 + i * 2.1) * spread * 0.55,
        z: -3 + ((i * 1.7 + seed) % 6),
        r: 2 + ((i * 1.3 + seed * 2) % 3.8),
        dy: ((i * 0.7 + seed) % 2.6) - 1.3,
        speed: 0.1 + (i % 4) * 0.05,
        phase: i * 1.4 + seed * 5,
      })),
    [seed, spread]
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.children.forEach((mesh, idx) => {
      if (idx === 0) {
        mesh.material.opacity = 0.1 + Math.sin(t * 0.3 + seed) * 0.03
        return
      }
      const d = discs[idx - 1]
      mesh.position.x = d.x + Math.sin(t * d.speed + d.phase) * 0.7
      mesh.position.y = y + d.dy + Math.cos(t * d.speed * 0.7 + d.phase) * 0.35
      const s = 1 + Math.sin(t * d.speed * 1.4 + d.phase) * 0.07
      mesh.scale.setScalar(s)
      mesh.rotation.z = Math.sin(t * d.speed * 0.5 + d.phase) * 0.2
    })
  })

  return (
    <group ref={group}>
      {/* stratum fog — a wide membrane that makes each depth read as a band */}
      <mesh position={[0, y, -5]}>
        <planeGeometry args={[44, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {discs.map((d, i) => (
        <mesh key={i} position={[d.x, y + d.dy, d.z]}>
          <circleGeometry args={[d.r, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// Collagen fibres — long thin strands only visible near the dermis floor
function Fibres() {
  const ref = useRef()
  const fibres = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: ((i * 3.1) % 26) - 13,
        y: -32 - ((i * 1.9) % 8),
        rot: -0.5 + ((i * 0.41) % 1),
        len: 5 + ((i * 1.7) % 7),
        speed: 0.08 + (i % 3) * 0.04,
        phase: i * 1.9,
      })),
    []
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ref.current.children.forEach((m, i) => {
      const f = fibres[i]
      m.rotation.z = f.rot + Math.sin(t * f.speed + f.phase) * 0.12
    })
  })
  return (
    <group ref={ref}>
      {fibres.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, -4]} rotation={[0, 0, f.rot]}>
          <planeGeometry args={[f.len, 0.08]} />
          <meshBasicMaterial color="#c9a227" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// Gold motes drifting like suspended serum particles, all the way down
function Motes() {
  const ref = useRef()
  const motes = useMemo(
    () =>
      Array.from({ length: 52 }, (_, i) => ({
        x: Math.sin(i * 12.9898) * 0.5 * 24,
        y: 2 - ((i * 0.93) % 42),
        z: -2 + ((i * 1.1) % 5),
        r: 0.04 + ((i * 0.37) % 0.09),
        speed: 0.2 + ((i * 0.13) % 0.4),
        phase: i * 2.3,
      })),
    []
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ref.current.children.forEach((m, i) => {
      const d = motes[i]
      m.position.x = d.x + Math.sin(t * d.speed + d.phase) * 0.9
      m.position.y = d.y + Math.cos(t * d.speed * 0.6 + d.phase) * 0.7
    })
  })
  return (
    <group ref={ref}>
      {motes.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]}>
          <circleGeometry args={[d.r, 12]} />
          <meshBasicMaterial color="#c9a227" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Rig({ progressRef }) {
  useFrame(({ camera, clock }) => {
    // scroll progress 0→1 sinks the camera from open air to the dermis floor
    const target = 2 - progressRef.current * 40
    camera.position.y += (target - camera.position.y) * 0.08
    // a barely-there breathing drift so the frame never feels frozen
    camera.position.x = Math.sin(clock.elapsedTime * 0.12) * 0.5
    camera.position.z = 8
    camera.lookAt(0, camera.position.y, 0)
  })
  return null
}

export default function DiveScene({ progressRef }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 2, 8], fov: 60 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {LAYERS.map((l, i) => (
        <Stratum key={i} {...l} seed={i + 1} />
      ))}
      <Fibres />
      <Motes />
      <Rig progressRef={progressRef} />
    </Canvas>
  )
}

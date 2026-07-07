import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

// The homepage spine: a camera travelling DOWN through translucent,
// warm-graded skin strata (surface → barrier → hydration → dermis).
// Desktop-capable devices get real 3D; mobile/reduced-motion callers should
// render the 2D parallax fallback in Home.jsx instead of this component.

const LAYERS = [
  { y: 0, color: '#e8ddc8', spread: 10 },   // surface — warm cream keratin
  { y: -9, color: '#c9a227', spread: 11 },  // barrier — champagne lipid film
  { y: -18, color: '#7a9a82', spread: 12 }, // hydration — sage water table
  { y: -27, color: '#1c3f30', spread: 13 }, // dermis — deep emerald
]

function Stratum({ y, color, spread, seed }) {
  const group = useRef()
  const discs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: Math.sin(seed * 7 + i * 2.1) * spread * 0.5,
        z: -2.5 + ((i * 1.7 + seed) % 5),
        r: 2.2 + ((i * 1.3 + seed * 2) % 3.4),
        dy: ((i * 0.7 + seed) % 1.6) - 0.8,
        speed: 0.1 + (i % 4) * 0.05,
        phase: i * 1.4 + seed * 5,
      })),
    [seed, spread]
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.children.forEach((mesh, i) => {
      const d = discs[i]
      mesh.position.x = d.x + Math.sin(t * d.speed + d.phase) * 0.6
      mesh.position.y = y + d.dy + Math.cos(t * d.speed * 0.7 + d.phase) * 0.3
      const s = 1 + Math.sin(t * d.speed * 1.4 + d.phase) * 0.06
      mesh.scale.setScalar(s)
    })
  })

  return (
    <group ref={group}>
      {discs.map((d, i) => (
        <mesh key={i} position={[d.x, y + d.dy, d.z]}>
          <circleGeometry args={[d.r, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.13} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Rig({ progressRef }) {
  useFrame(({ camera }) => {
    // scroll progress 0→1 carries the camera from surface to dermis
    const target = -progressRef.current * 27
    camera.position.y += (target - camera.position.y) * 0.08
    camera.position.z = 8
    camera.lookAt(0, camera.position.y, 0)
  })
  return null
}

export default function SkinDescent({ progressRef }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 8], fov: 60 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {LAYERS.map((l, i) => (
        <Stratum key={i} {...l} seed={i + 1} />
      ))}
      <Rig progressRef={progressRef} />
    </Canvas>
  )
}

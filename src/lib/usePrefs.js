import { useSyncExternalStore } from 'react'

// Capability + preference gates. Every expensive effect checks these.

function subscribeMedia(query) {
  return (cb) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMedia('(prefers-reduced-motion: reduce)'),
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  )
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribeMedia('(max-width: 767px)'),
    () => window.matchMedia('(max-width: 767px)').matches,
    () => false
  )
}

export function useHasFinePointer() {
  return useSyncExternalStore(
    subscribeMedia('(pointer: fine)'),
    () => window.matchMedia('(pointer: fine)').matches,
    () => false
  )
}

// Rough capability check: full 3D + heavy particles only on capable desktops.
export function isCapableDevice() {
  if (typeof navigator === 'undefined') return false
  const mem = navigator.deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency ?? 8
  return mem >= 4 && cores >= 4
}

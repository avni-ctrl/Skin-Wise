// Tiny event bus so tool pages can feed REAL user signals into the living
// backdrop (Skin Garden AM/PM, Formula Lab conflict flashes) without prop
// drilling through the router.
let state = { gardenMode: 'AM', conflictPulse: 0, harmonyPulse: 0 }
const listeners = new Set()

export const backdropBus = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch }
    listeners.forEach((fn) => fn(state))
  },
  pulseConflict() {
    this.set({ conflictPulse: Date.now() })
  },
  pulseHarmony() {
    this.set({ harmonyPulse: Date.now() })
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

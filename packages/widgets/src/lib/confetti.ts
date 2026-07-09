/**
 * The library-wide celebration burst: lazy-loads the optional canvas-confetti
 * dependency, respects reduced motion, and silently no-ops when the package
 * isn't installed. Fire it only from a reader-triggered completion — never on
 * hydration of an already-done state.
 */
export async function fireConfetti() {
  try {
    const mod = await import("canvas-confetti");
    mod.default({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      disableForReducedMotion: true,
    });
  } catch {
    /* canvas-confetti is optional — silently skip if unavailable */
  }
}

/**
 * The library-wide celebration burst: lazy-loads the optional canvas-confetti
 * dependency and respects reduced motion. When the package isn't installed the
 * payoff falls back to a small dependency-free CSS burst (the `wgt-confetti`
 * keyframe in theme.css) instead of silently disappearing. Fire it only from a
 * reader-triggered completion — never on hydration of an already-done state.
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
    cssConfettiFallback();
  }
}

/* ponytail: 14 CSS particles, no physics — canvas-confetti takes over when installed */
function cssConfettiFallback() {
  // Both guards: this runs async after the import rejects, and by then a test
  // environment may have torn down window while document (or vice versa) lingers.
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const stage = document.createElement("div");
  stage.setAttribute("aria-hidden", "true");
  stage.style.cssText =
    "position:fixed;left:50%;top:60%;z-index:9999;pointer-events:none;";
  const colors = ["--primary", "--success", "--info", "--warning"];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const dist = 80 + Math.random() * 140;
    const particle = document.createElement("i");
    particle.style.cssText =
      `position:absolute;width:8px;height:12px;border-radius:2px;` +
      `background:var(${colors[i % colors.length]});` +
      `--dx:${Math.round(Math.cos(angle) * dist)}px;` +
      `--dy:${Math.round(Math.sin(angle) * dist - 160)}px;` +
      `--rot:${Math.round(180 + Math.random() * 360)}deg;` +
      `animation:wgt-confetti ${Math.round(900 + Math.random() * 300)}ms ` +
      `cubic-bezier(0.22,1,0.36,1) ${Math.round(Math.random() * 120)}ms both;`;
    stage.appendChild(particle);
  }
  document.body.appendChild(stage);
  setTimeout(() => stage.remove(), 1600);
}

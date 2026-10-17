import { useEffect } from "react";

export default function ConfettiBurst({ burstId }) {
  useEffect(() => {
    if (!burstId || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let active = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (!active) return;
      confetti({
        particleCount: 90,
        spread: 68,
        startVelocity: 34,
        origin: { y: 0.68 },
        colors: ["#70E000", "#7C3AED", "#FF4D8D", "#FFD60A", "#00C2FF"],
        disableForReducedMotion: true,
      });
    }).catch((error) => {
      console.error("Unable to load the confetti effect.", error);
    });
    return () => { active = false; };
  }, [burstId]);
  return null;
}

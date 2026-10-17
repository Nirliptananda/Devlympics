import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function SynergyRing({ score }) {
  const reduceMotion = useReducedMotion();
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = value < 50 ? "text-orange" : value < 80 ? "text-sky" : "text-spark";
  const count = useMotionValue(0);
  const rounded = useTransform(count, (current) => Math.round(current));
  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return undefined;
    }
    const animation = animate(count, value, { duration: 0.8 });
    return () => animation.stop();
  }, [count, reduceMotion, value]);
  return (
    <div className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center" aria-label={`${value}% synergy`}>
      <svg className="-rotate-90" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="23" fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <motion.circle
          cx="28"
          cy="28"
          r="23"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={144.5}
          initial={{ strokeDashoffset: reduceMotion ? 144.5 - (144.5 * value) / 100 : 144.5 }}
          animate={{ strokeDashoffset: 144.5 - (144.5 * value) / 100 }}
          transition={{ duration: reduceMotion ? 0 : 0.8 }}
          className={tone}
        />
      </svg>
      <span className="absolute text-sm font-extrabold"><motion.span>{rounded}</motion.span>%</span>
    </div>
  );
}

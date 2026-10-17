import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function MatchBadge({ score }) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (current) => Math.round(current));
  useEffect(() => {
    if (reduceMotion) {
      count.set(score);
      return undefined;
    }
    const animation = animate(count, Number(score) || 0, { duration: 0.8 });
    return () => animation.stop();
  }, [count, reduceMotion, score]);
  return (
    <span className="inline-flex rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-extrabold text-ink shadow-[2px_2px_0_0_#0B0B0F]">
      ⚡ <motion.span>{rounded}</motion.span>% match
    </span>
  );
}

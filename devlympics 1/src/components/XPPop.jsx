import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export default function XPPop({ event }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -24 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.8 }}
          className="pointer-events-none fixed bottom-8 right-6 z-[100] rounded-full border-2 border-ink bg-sun px-4 py-2 font-extrabold text-ink shadow-pop-sm"
          role="status"
        >
          +{event.amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

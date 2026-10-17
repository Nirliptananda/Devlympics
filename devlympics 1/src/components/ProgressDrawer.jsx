import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useGame } from "../gamification/GameContext.jsx";
import { getLevelProgress } from "../gamification/rules.js";
import BadgeShelf from "./BadgeShelf.jsx";
import QuestList from "./QuestList.jsx";
import Sparky from "./Sparky.jsx";

export default function ProgressDrawer() {
  const {
    progressOpen, setProgressOpen, level, totalXp, profileXp, activityXp, streak,
    levelUp, setLevelUp, badgeNotice, setBadgeNotice, welcomeName, setWelcomeName,
  } = useGame();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!progressOpen && !levelUp) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setProgressOpen(false);
        setLevelUp(null);
        setWelcomeName("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [progressOpen, levelUp, welcomeName, setProgressOpen, setLevelUp, setWelcomeName]);

  return (
    <>
      {badgeNotice && (
        <div className="fixed bottom-5 right-5 z-[90] flex max-w-sm items-center gap-3 rounded-2xl border-[3px] border-ink bg-sun p-4 shadow-pop" role="status">
          <span className="text-3xl" aria-hidden="true">{badgeNotice.emoji}</span>
          <p className="flex-1 font-extrabold">Badge unlocked: {badgeNotice.name}! +10 XP</p>
          <button className="rounded-full p-1 hover:bg-white/50" type="button" aria-label="Dismiss badge notice" onClick={() => setBadgeNotice(null)}><X size={17} /></button>
        </div>
      )}
      <AnimatePresence>
        {progressOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-[70] bg-ink/40"
              aria-label="Close progress"
              onClick={() => setProgressOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[80] w-full max-w-md overflow-y-auto border-l-[3px] border-ink bg-cream p-5 shadow-pop sm:p-7"
              role="dialog"
              aria-modal="true"
              aria-labelledby="progress-heading"
              initial={{ x: reduceMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduceMotion ? 0 : "100%" }}
              transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
            >
              <header className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-violet">Your adventure</p>
                  <h2 className="font-display text-3xl font-extrabold" id="progress-heading">Progress</h2>
                </div>
                <button className="rounded-xl border-[3px] border-ink bg-white p-2 shadow-pop-sm" type="button" aria-label="Close progress drawer" onClick={() => setProgressOpen(false)}><X /></button>
              </header>
              <section className="mt-5 rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop-sm">
                <p className="text-lg font-extrabold">{level.emoji} Level {level.level} · {level.name}</p>
                <p className="mt-2 text-2xl font-extrabold">{totalXp} XP</p>
                <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-ink bg-mist"><div className="h-full bg-spark transition-all" style={{ width: `${getLevelProgress(totalXp)}%` }} /></div>
                <p className="mt-3 text-sm">Profile XP <strong>{profileXp}</strong> · Activity XP <strong>{activityXp}</strong></p>
                <p className="mt-1 text-sm">🔥 {streak}-day streak</p>
              </section>
              <section className="mt-6">
                <h3 className="mb-3 font-display text-xl font-extrabold">Daily quests</h3>
                <QuestList compact />
              </section>
              <section className="mt-6">
                <h3 className="mb-3 font-display text-xl font-extrabold">Badge shelf</h3>
                <BadgeShelf />
              </section>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {welcomeName && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/50 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section className="w-full max-w-sm rounded-[2rem] border-[3px] border-ink bg-sun p-8 text-center shadow-pop" initial={{ scale: reduceMotion ? 1 : 0.8 }} animate={{ scale: 1 }} role="dialog" aria-modal="true" aria-labelledby="welcome-heading">
              <span className="text-6xl" aria-hidden="true">⚡</span>
              <p className="mt-3 font-extrabold uppercase tracking-widest">Welcome, {welcomeName}!</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold" id="welcome-heading">Your adventure begins!</h2>
              <Sparky className="mt-4 justify-center" message="Let’s build something brilliant!" />
              <p className="mt-2">{level.emoji} {level.name} · Hello World 👋</p>
              <button className="mt-6 rounded-xl border-[3px] border-ink bg-spark px-6 py-3 font-extrabold shadow-pop-sm" type="button" onClick={() => setWelcomeName("")}>Let&apos;s find my team!</button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {levelUp && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/50 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section className="w-full max-w-sm rounded-[2rem] border-[3px] border-ink bg-sun p-8 text-center shadow-pop" initial={{ scale: reduceMotion ? 1 : 0.8 }} animate={{ scale: 1 }} role="dialog" aria-modal="true" aria-labelledby="level-up-heading">
              <span className="text-6xl" aria-hidden="true">{levelUp.emoji}</span>
              <p className="mt-3 text-sm font-extrabold uppercase tracking-widest">Level up!</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold" id="level-up-heading">You reached {levelUp.name}!</h2>
              <Sparky className="mt-4 justify-center" message="Keep shining, teammate!" />
              <button className="mt-6 rounded-xl border-[3px] border-ink bg-spark px-6 py-3 font-extrabold shadow-pop-sm" type="button" onClick={() => setLevelUp(null)}>Let&apos;s go!</button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

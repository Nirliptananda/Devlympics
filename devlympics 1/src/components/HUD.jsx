import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { getLevelProgress } from "../gamification/rules.js";
import { useGame } from "../gamification/GameContext.jsx";

const ProgressDrawer = lazy(() => import("./ProgressDrawer.jsx"));

export default function HUD() {
  const { level, totalXp, streak, setProgressOpen } = useGame();
  const previousStreak = useRef(streak);
  const [streakIncreased, setStreakIncreased] = useState(false);

  useEffect(() => {
    if (streak > previousStreak.current) {
      setStreakIncreased(true);
      const timeout = window.setTimeout(() => setStreakIncreased(false), 700);
      previousStreak.current = streak;
      return () => window.clearTimeout(timeout);
    }
    previousStreak.current = streak;
    return undefined;
  }, [streak]);

  return (
    <>
      <button
        className="flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-2.5 py-2 text-left shadow-pop-sm transition hover:-translate-y-0.5 sm:gap-3 sm:px-3"
        type="button"
        aria-label={`Open progress: level ${level.level} ${level.name}, ${totalXp} XP, ${streak} day streak`}
        onClick={() => setProgressOpen(true)}
      >
        <span className="text-xl sm:text-2xl" aria-hidden="true">{level.emoji}</span>
        <span className="min-w-10 sm:min-w-24">
          <span className="hidden text-xs font-extrabold sm:block">{level.name} · {totalXp} XP</span>
          <span className="mt-1 block h-2 overflow-hidden rounded-full border border-ink bg-mist">
            <span className="block h-full bg-spark" style={{ width: `${getLevelProgress(totalXp)}%` }} />
          </span>
        </span>
        <span className={`text-sm font-extrabold sm:text-xs ${streakIncreased ? "motion-safe:animate-bounce" : ""}`}>{streak}🔥</span>
      </button>
      <Suspense fallback={<span className="sr-only" role="status">Loading progress…</span>}>
        <ProgressDrawer />
      </Suspense>
    </>
  );
}

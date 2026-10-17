import { useGame } from "../gamification/GameContext.jsx";

export default function QuestList({ compact = false }) {
  const { quests } = useGame();
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {quests.map((quest) => {
        const progress = quest.percent ? quest.progress : Math.min(100, (quest.progress / quest.target) * 100);
        return (
          <article className="rounded-xl border-2 border-ink bg-white p-3" key={quest.id}>
            <div className="flex items-start gap-2">
              <span className="text-xl" aria-hidden="true">{quest.complete ? "✅" : quest.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <h3 className="text-sm font-extrabold">{quest.title}</h3>
                  <span className="shrink-0 text-xs font-bold">{quest.complete ? "Done!" : quest.percent ? `${quest.progress}%` : `${quest.progress}/${quest.target}`}</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-ink bg-mist">
                  <div className="h-full rounded-full bg-spark transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-gray-600">Reward: +20 XP</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

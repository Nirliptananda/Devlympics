import { badgeDefinitions } from "../gamification/rules.js";
import { useGame } from "../gamification/GameContext.jsx";

export default function BadgeShelf({ compact = false }) {
  const { unlockedBadges } = useGame();
  const badges = compact ? badgeDefinitions.slice(0, 4) : badgeDefinitions;
  return (
    <div className={`grid ${compact ? "grid-cols-4 gap-2" : "grid-cols-2 gap-3 sm:grid-cols-4"}`}>
      {badges.map((badge) => {
        const unlocked = unlockedBadges.includes(badge.id);
        return (
          <div className={`rounded-2xl border-2 border-ink p-3 text-center ${unlocked ? "bg-sun" : "bg-mist text-gray-500"}`} key={badge.id} title={unlocked ? badge.name : badge.hint}>
            <span className="text-2xl" aria-hidden="true">{unlocked ? badge.emoji : "🔒"}</span>
            <p className="mt-1 text-xs font-extrabold">{badge.name}</p>
            {!compact && <p className="mt-1 text-[10px] leading-4">{unlocked ? "Unlocked!" : badge.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

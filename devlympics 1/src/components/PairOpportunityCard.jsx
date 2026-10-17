import { useEffect, useRef } from "react";
import { ArrowUpRight, CalendarDays, MapPin, Trophy } from "lucide-react";
import MatchBadge from "./MatchBadge.jsx";
import SkillChip from "./SkillChip.jsx";
import TeamSlots from "./TeamSlots.jsx";
import { useGame } from "../gamification/GameContext.jsx";

function formatDeadline(deadline) {
  if (!deadline) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${deadline}T00:00:00`));
}

function SkillRow({ label, skills, variant, emptyMessage }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:items-start">
      <p className="text-sm font-semibold">{label}</p>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => <SkillChip key={skill} label={skill} variant={variant} />)}
        </div>
      ) : (
        <p className="text-sm text-gray-600">{emptyMessage}</p>
      )}
    </div>
  );
}

export default function PairOpportunityCard({ item, viewer, person }) {
  const { opportunity, match_score, you_cover, they_cover, uncovered } = item;
  const deadline = formatDeadline(opportunity.deadline);
  const { celebrate, trackOpportunity, trackPairOpportunity } = useGame();
  const celebrated = useRef(false);

  useEffect(() => {
    trackPairOpportunity(match_score);
    if (uncovered.length === 0 && !celebrated.current) {
      celebrated.current = true;
      celebrate();
    }
  }, [celebrate, match_score, trackPairOpportunity, uncovered.length]);

  return (
    <article className="relative overflow-hidden rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop">
      <div className="absolute inset-x-0 top-0 h-2 bg-violet" aria-hidden="true" />
      {uncovered.length === 0 && <div className="absolute right-0 top-2 rounded-bl-xl border-b-[3px] border-l-[3px] border-ink bg-sun px-3 py-2 text-sm font-extrabold">Dream Team 🏆</div>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border-2 border-ink bg-pink px-3 py-1 text-xs font-extrabold capitalize">{opportunity.type}</span>
            <span className="rounded-full border-2 border-ink px-3 py-1 text-xs font-semibold capitalize">{opportunity.source}</span>
          </div>
          <h3 className="mt-3 font-display text-xl font-extrabold leading-snug">{opportunity.title}</h3>
          {opportunity.organizer && <p className="mt-1 text-sm text-gray-600">{opportunity.organizer}</p>}
        </div>
        <MatchBadge score={match_score} />
      </div>

      <p className="mt-3 text-sm leading-6 text-gray-700">{opportunity.description}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-700">
        {opportunity.prize && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-sun px-2 py-1 font-bold">
            <Trophy size={14} aria-hidden="true" /> {opportunity.prize}
          </span>
        )}
        {opportunity.mode && (
          <span className="inline-flex items-center gap-1.5 capitalize">
            <MapPin size={14} aria-hidden="true" /> {opportunity.mode}
          </span>
        )}
        {deadline && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden="true" /> {deadline}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4 border-t border-black/10 pt-4">
        <TeamSlots item={item} viewer={viewer} person={person} />
        <SkillRow label="You cover" skills={you_cover} variant="shared" emptyMessage="No required skills covered." />
        <SkillRow label="They cover" skills={they_cover} variant="complementary" emptyMessage="No required skills covered." />
        <SkillRow
          label="Still needed"
          skills={uncovered}
          variant="neutral"
          emptyMessage="Nothing, you two cover it all 🎉"
        />
      </div>

      <a
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-ink bg-spark px-4 py-2.5 text-sm font-extrabold text-ink shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-spark-dark active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackOpportunity(opportunity.id)}
      >
        View opportunity <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </article>
  );
}

import { ArrowUpRight, CalendarDays, MapPin, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import MatchBadge from "./MatchBadge.jsx";
import SkillChip from "./SkillChip.jsx";
import { useGame } from "../gamification/GameContext.jsx";

const typeStyles = {
  hackathon: "bg-pink",
  competition: "bg-orange",
  project: "bg-sky",
  other: "bg-mist",
};

function formatDeadline(deadline) {
  if (!deadline) return "";
  const date = new Date(`${deadline}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function OpportunityCard({ item }) {
  const opportunity = item.opportunity || item;
  const { match_score, matched_skills, missing_skills } = item;
  const deadline = formatDeadline(opportunity.deadline);
  const daysLeft = opportunity.deadline ? Math.ceil((new Date(`${opportunity.deadline}T00:00:00`) - new Date(new Date().toDateString())) / 86400000) : null;
  const urgencyClass = daysLeft === null ? "" : daysLeft <= 7 ? "bg-rose-100 text-danger" : daysLeft <= 30 ? "bg-orange text-ink" : "bg-spark text-ink";
  const reduceMotion = useReducedMotion();
  const { trackOpportunity } = useGame();

  return (
    <motion.article className="relative flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop" whileHover={reduceMotion ? undefined : { y: -2, boxShadow: "8px 8px 0 0 #0B0B0F" }} transition={{ duration: 0.18 }}>
      <div className={`absolute inset-x-0 top-0 h-2 ${typeStyles[opportunity.type] || typeStyles.other}`} aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold capitalize ${typeStyles[opportunity.type] || typeStyles.other}`}>{opportunity.type}</span>
          <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-semibold capitalize">{opportunity.source}</span>
        </div>
        {match_score !== undefined && <MatchBadge score={match_score} />}
      </div>

      <h3 className="mt-4 font-display text-xl font-extrabold leading-snug">{opportunity.title}</h3>
      {opportunity.organizer && <p className="mt-1 text-sm text-gray-600">{opportunity.organizer}</p>}
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-700">{opportunity.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-700">
        {opportunity.prize && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-sun px-2 py-1 font-bold text-ink">
            <Trophy size={14} aria-hidden="true" /> {opportunity.prize}
          </span>
        )}
        {opportunity.mode && (
          <span className="inline-flex items-center gap-1.5 capitalize">
            <MapPin size={14} aria-hidden="true" /> {opportunity.mode}
          </span>
        )}
        {deadline && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-1 font-bold ${urgencyClass}`}>
            <CalendarDays size={14} aria-hidden="true" /> {deadline}{daysLeft !== null && daysLeft >= 0 ? ` · ${daysLeft}d left` : ""}
          </span>
        )}
      </div>

      {(matched_skills || missing_skills) && (
        <div className="mt-4 space-y-3">
          {matched_skills?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold">Skills you have</p>
              <div className="flex flex-wrap gap-2">
                {matched_skills.map((skill) => <SkillChip key={skill} label={skill} variant="shared" />)}
              </div>
            </div>
          )}
          {missing_skills?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold">Skills to add</p>
              <div className="flex flex-wrap gap-2">
                {missing_skills.map((skill) => (
                  <span className="inline-flex rounded-full border-2 border-dashed border-ink bg-white px-3 py-1 text-xs font-semibold" key={skill}>
                    ❓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <a
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-ink bg-white px-4 py-2.5 text-sm font-extrabold text-ink shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-sun active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackOpportunity(opportunity.id)}
      >
        View opportunity <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </motion.article>
  );
}

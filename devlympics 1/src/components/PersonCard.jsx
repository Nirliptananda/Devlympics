import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import SkillChip from "./SkillChip.jsx";
import SynergyRing from "./SynergyRing.jsx";
import YouTheyBar from "./YouTheyBar.jsx";
import { getDisciplineStyle } from "../styles/disciplines.js";

function InitialsAvatar({ name, discipline }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const style = getDisciplineStyle(discipline);
  return (
    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-ink ${style.bg} ${style.text} text-sm font-extrabold shadow-pop-sm`} aria-hidden="true">
      {initials}
    </span>
  );
}

export default function PersonCard({ item }) {
  const { profile, match_score, shared_skills, complementary_skills, shared_interests, reason } = item;
  const style = getDisciplineStyle(profile.discipline);
  const reduceMotion = useReducedMotion();

  return (
    <motion.article className="relative flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop" whileHover={reduceMotion ? undefined : { y: -2, rotateX: 1.5, rotateY: -1.5, boxShadow: "8px 8px 0 0 #0B0B0F" }} transition={{ duration: 0.18 }}>
      <div className={`absolute inset-x-0 top-0 h-2 ${style.bg}`} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <InitialsAvatar name={profile.full_name} discipline={profile.discipline} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl font-extrabold">{profile.full_name}</h3>
          <span className={`mt-1 inline-flex rounded-full border-2 border-ink px-2.5 py-1 text-xs font-bold ${style.bg} ${style.text}`}>{style.emoji} {profile.discipline_label}</span>
          <p className="mt-1 text-xs font-semibold capitalize text-gray-600">{profile.experience_level}</p>
        </div>
        <SynergyRing score={match_score} />
      </div>

      {profile.bio && <p className="mt-4 line-clamp-2 text-sm leading-6">{profile.bio}</p>}
      <p className="mt-3 rounded-xl border-2 border-ink bg-cream p-3 text-sm leading-6 text-ink">“{reason}”</p>

      <div className="mt-4 space-y-3">
        <YouTheyBar sharedCount={shared_skills.length} complementaryCount={complementary_skills.length} />
        <div>
          <p className="mb-2 text-xs font-extrabold">You both know</p>
          <div className="flex flex-wrap gap-2">
            {shared_skills.map((skill) => <SkillChip key={skill} label={skill} variant="shared" />)}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-extrabold">They bring</p>
          <div className="flex flex-wrap gap-2">
            {complementary_skills.map((skill) => <SkillChip key={skill} label={skill} variant="complementary" />)}
          </div>
        </div>
        {shared_interests.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-extrabold">Shared interests</p>
            <div className="flex flex-wrap gap-2">
              {shared_interests.map((interest) => <SkillChip key={interest} label={interest} />)}
            </div>
          </div>
        )}
      </div>

      <Link
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-ink bg-spark px-4 py-2.5 text-sm font-extrabold text-ink shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-spark-dark active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        to={`/people/${profile.id}`}
        aria-label={`View ${profile.full_name}'s profile`}
      >
        View profile <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </motion.article>
  );
}

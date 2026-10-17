import { getDisciplineStyle } from "../styles/disciplines.js";

function SlotAvatar({ name, discipline }) {
  const style = getDisciplineStyle(discipline);
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "•";
  return <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink ${style.bg} ${style.text} text-xs font-extrabold`} aria-label={name}>{initials}</span>;
}

export default function TeamSlots({ item, viewer, person }) {
  const opportunity = item.opportunity || {};
  const requiredSkills = opportunity.required_skills || [];
  const yourSkills = new Set((item.you_cover || []).map((skill) => skill.toLowerCase()));
  const theirSkills = new Set((item.they_cover || []).map((skill) => skill.toLowerCase()));
  const missing = new Set((item.uncovered || []).map((skill) => skill.toLowerCase()));
  const coveredCount = requiredSkills.filter((skill) => !missing.has(skill.toLowerCase())).length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-extrabold">Team slots</h3>
        <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-extrabold">Team {coveredCount}/{requiredSkills.length} filled</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {requiredSkills.map((skill) => {
          const lower = skill.toLowerCase();
          const youHave = yourSkills.has(lower);
          const theyHave = theirSkills.has(lower);
          const isMissing = missing.has(lower) || (!youHave && !theyHave);
          return (
            <div className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border-[3px] p-3 text-center ${isMissing ? "border-dashed border-ink bg-mist" : "border-ink bg-white shadow-pop-sm"}`} key={skill}>
              <div className="flex items-center justify-center">
                {isMissing ? <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-white text-lg">❓</span> : (
                  <>
                    {youHave && <SlotAvatar name={viewer?.full_name || "You"} discipline={viewer?.discipline} />}
                    {theyHave && <span className={youHave ? "-ml-3" : ""}><SlotAvatar name={person?.full_name || "Teammate"} discipline={person?.discipline} /></span>}
                  </>
                )}
              </div>
              <span className="mt-2 text-xs font-extrabold">{skill}</span>
              {isMissing && <span className="text-[10px] font-semibold">Still needed</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

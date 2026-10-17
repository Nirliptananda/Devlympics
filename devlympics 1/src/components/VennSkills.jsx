export default function VennSkills({ yourSkills = [], theirSkills = [], yourName = "You", theirName = "Teammate" }) {
  const yours = new Set(yourSkills.map((skill) => skill.trim().toLowerCase()));
  const theirs = new Set(theirSkills.map((skill) => skill.trim().toLowerCase()));
  const shared = theirSkills.filter((skill) => yours.has(skill.trim().toLowerCase()));
  const uniqueYours = yourSkills.filter((skill) => !theirs.has(skill.trim().toLowerCase()));
  const uniqueTheirs = theirSkills.filter((skill) => !yours.has(skill.trim().toLowerCase()));
  return (
    <div className="relative grid gap-3 sm:grid-cols-2" aria-label="Skill overlap">
      <div className="rounded-[2rem] border-[3px] border-ink bg-sky/60 p-5 sm:rounded-r-none">
        <h3 className="font-extrabold">You · {yourName}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">{uniqueYours.map((skill) => <li className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold" key={skill}>{skill}</li>)}</ul>
      </div>
      <div className="rounded-[2rem] border-[3px] border-ink bg-pink/50 p-5 sm:rounded-l-none">
        <h3 className="font-extrabold">Them · {theirName}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">{uniqueTheirs.map((skill) => <li className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold" key={skill}>{skill}</li>)}</ul>
      </div>
      <div className="rounded-2xl border-[3px] border-ink bg-spark p-4 sm:absolute sm:left-1/2 sm:top-1/2 sm:z-10 sm:w-[40%] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:shadow-pop-sm">
        <h3 className="text-center text-sm font-extrabold">You both know</h3>
        <ul className="mt-2 flex flex-wrap justify-center gap-2">{shared.map((skill) => <li className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold" key={skill}>{skill}</li>)}</ul>
        {!shared.length && <p className="mt-1 text-center text-xs">Your next shared skill starts here.</p>}
      </div>
    </div>
  );
}

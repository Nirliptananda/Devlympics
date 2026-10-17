const variants = {
  shared: "border-2 border-ink bg-spark text-ink",
  complementary: "border-2 border-ink bg-violet text-white",
  neutral: "border-2 border-ink bg-white text-ink",
};

export default function SkillChip({ label, variant = "neutral", emoji = "" }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-transform hover:-translate-y-0.5 motion-safe:hover:animate-wiggle ${variants[variant] || variants.neutral}`}>
      {emoji && <span className="mr-1" aria-hidden="true">{emoji}</span>}{label}
    </span>
  );
}

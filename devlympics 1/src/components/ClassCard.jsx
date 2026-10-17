export default function ClassCard({ emoji, label, detail, selected, onClick, className = "", selectedClassName = "bg-spark" }) {
  return (
    <button
      className={`flex min-h-24 flex-col items-start justify-center rounded-2xl border-[3px] border-ink p-4 text-left transition hover:-translate-y-1 hover:shadow-pop-sm active:translate-y-0 ${selected ? `${selectedClassName} shadow-pop-sm` : "bg-white"} ${className}`}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <span className="mt-1 font-extrabold">{label}</span>
      {detail && <span className="text-xs text-ink/70">{detail}</span>}
    </button>
  );
}

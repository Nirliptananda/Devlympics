export default function Sparky({ message, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-sun text-2xl shadow-pop-sm motion-safe:animate-floaty" aria-hidden="true">⚡</span>
      {message && <p className="rounded-2xl border-[3px] border-ink bg-white px-4 py-3 text-sm font-bold shadow-pop-sm">{message}</p>}
    </div>
  );
}

export default function Loader({ fullScreen = false, label = "Loading" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? "min-h-[60vh]" : "py-10"}`} role="status" aria-label={label}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-ink bg-spark text-3xl shadow-pop-sm motion-safe:animate-floaty" aria-hidden="true">⚡</span>
      <span className="text-sm font-bold">{label}...</span>
      <span className="flex gap-2" aria-hidden="true">
        <i className="h-3 w-3 rounded-full bg-pink motion-safe:animate-bounce" />
        <i className="h-3 w-3 rounded-full bg-sky motion-safe:animate-bounce [animation-delay:120ms]" />
        <i className="h-3 w-3 rounded-full bg-sun motion-safe:animate-bounce [animation-delay:240ms]" />
      </span>
    </div>
  );
}

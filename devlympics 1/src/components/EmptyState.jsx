export default function EmptyState({ title, message, action }) {
  return (
    <section className="rounded-2xl border-[3px] border-ink bg-white px-6 py-10 text-center shadow-pop">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-ink bg-sun text-3xl motion-safe:animate-floaty" aria-hidden="true">⚡</div>
      <p className="mt-3 text-sm font-extrabold uppercase tracking-widest text-violet">Sparky says</p>
      <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-700">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

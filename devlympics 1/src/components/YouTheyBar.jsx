export default function YouTheyBar({ sharedCount, complementaryCount }) {
  const total = sharedCount + complementaryCount;
  const sharedWidth = total ? (sharedCount / total) * 100 : 50;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-bold">
        <span>You both know · {sharedCount}</span>
        <span>They bring · {complementaryCount}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full border-2 border-ink bg-white" role="img" aria-label={`${sharedCount} shared skills and ${complementaryCount} complementary skills`}>
        <span className="bg-spark" style={{ width: `${sharedWidth}%` }} />
        <span className="bg-violet" style={{ width: `${100 - sharedWidth}%` }} />
      </div>
    </div>
  );
}

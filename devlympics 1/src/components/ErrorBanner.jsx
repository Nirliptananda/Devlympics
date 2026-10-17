import { AlertCircle } from "lucide-react";

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[3px] border-danger bg-white px-4 py-3 text-sm font-semibold text-danger shadow-[4px_4px_0_0_#0B0B0F]" role="alert">
      <span className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        {message}
      </span>
      {onRetry && (
        <button className="font-semibold underline underline-offset-2" type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

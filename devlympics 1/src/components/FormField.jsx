import { useId } from "react";

export default function FormField({ label, error, children, htmlFor, optional = false, group = false }) {
  const generatedId = useId();
  const id = htmlFor || generatedId;
  return (
    <div className="space-y-1.5">
      {group ? (
        <p className="block text-sm font-bold text-ink" id={`${id}-label`}>{label}{optional && <span className="ml-1 font-normal text-gray-500">(optional)</span>}</p>
      ) : (
        <label className="block text-sm font-bold text-ink" id={`${id}-label`} htmlFor={id}>
          {label}{optional && <span className="ml-1 font-normal text-gray-500">(optional)</span>}
        </label>
      )}
      {children(id, error ? `${id}-error` : undefined)}
      {error && <p className="text-sm text-danger" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

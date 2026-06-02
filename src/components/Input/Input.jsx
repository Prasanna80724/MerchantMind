import { cn } from "../../utils/cn";

export default function Input({ label, error, className, id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 shadow-sm transition",
          "placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-slate-200"
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className, children, id, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 shadow-sm transition",
          "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          error ? "border-danger" : "border-slate-200"
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

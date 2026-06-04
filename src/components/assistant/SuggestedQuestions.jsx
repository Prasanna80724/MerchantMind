import { Sparkles } from "lucide-react";

export default function SuggestedQuestions({
  questions = [],
  onSelect,
  disabled,
  compact = false,
}) {
  if (!questions.length) return null;

  return (
    <div className={compact ? "" : "border-b border-slate-100 bg-slate-50/60 px-4 py-3"}>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
        Try asking
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

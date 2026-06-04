import { Sparkles } from "lucide-react";

const DEFAULT_SUGGESTIONS = [
  "Which items need reordering soon?",
  "Who are my active suppliers?",
  "What is the total value of my inventory?",
  "What sold best this month?",
  "Show my latest sales",
  "Which purchase orders are still pending?",
];

export default function SuggestedQuestions({ questions = DEFAULT_SUGGESTIONS, onSelect, disabled }) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
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
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

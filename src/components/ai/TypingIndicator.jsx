import { Sparkles } from "lucide-react";

export default function TypingIndicator({ label = "Looking up your shop data..." }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/20 to-violet-500/20 text-brand-600">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[var(--shadow-card)]">
        <span className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
        </span>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
    </div>
  );
}

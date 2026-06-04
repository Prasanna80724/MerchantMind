import { Send } from "lucide-react";
import Button from "../Button/Button";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled && value.trim()) onSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white p-3">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          maxLength={500}
          placeholder="Ask about stock, suppliers, sales..."
          className="min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50"
        />
        <Button type="submit" size="sm" disabled={disabled || !value.trim()} className="self-end shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

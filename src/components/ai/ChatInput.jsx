import { Send } from "lucide-react";
import Button from "../Button/Button";

export default function ChatInput({ value, onChange, onSend, disabled, placeholder }) {
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
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          maxLength={500}
          placeholder={placeholder || "Ask about inventory, suppliers, sales..."}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
        />
        <Button type="submit" disabled={disabled || !value.trim()} className="self-end shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1 text-xs text-slate-400">Press Enter to send</p>
    </form>
  );
}

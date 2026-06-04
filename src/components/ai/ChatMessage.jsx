import { Sparkles, User } from "lucide-react";
import { cn } from "../../utils/cn";
import AssistantResponse from "./AssistantResponse";

export default function ChatMessage({ role, content, summary, presentation, isError = false }) {
  const isUser = role === "user";
  const text = (summary || content || "").trim();
  const showStructured = !isUser && !isError && presentation?.type;

  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-indigo-600 text-white" : "bg-gradient-to-br from-brand-500/20 to-violet-500/20 text-brand-600"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {isUser ? (
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-indigo-600 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
          {text}
        </div>
      ) : (
        <div
          className={cn(
            "w-full min-w-0",
            isError
              ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              : "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm"
          )}
        >
          {isError ? (
            text || "Something went wrong."
          ) : showStructured ? (
            <AssistantResponse summary={text} presentation={presentation} />
          ) : (
            <p className="text-sm leading-relaxed text-slate-700">
              {text || "I couldn't display a response. Please try again."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

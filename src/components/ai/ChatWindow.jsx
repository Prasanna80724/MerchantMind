import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestedQuestions from "./SuggestedQuestions";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({
  messages,
  input,
  onInputChange,
  onSend,
  loading,
  suggestions = [],
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex h-[calc(100vh-22rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <SuggestedQuestions questions={suggestions} onSelect={onSend} disabled={loading} />

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            summary={msg.summary}
            presentation={msg.presentation}
            isError={msg.isError}
          />
        ))}

        {loading && <TypingIndicator />}
      </div>

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSend={() => onSend(input)}
        disabled={loading}
      />
    </div>
  );
}

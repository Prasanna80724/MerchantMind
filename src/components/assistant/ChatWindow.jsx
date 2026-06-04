import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import WelcomeScreen from "./WelcomeScreen";
import TypingIndicator from "../ai/TypingIndicator";

export default function ChatWindow({
  messages,
  input,
  onInputChange,
  onSend,
  loading,
  suggestions,
  showWelcome,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {showWelcome && (
          <WelcomeScreen
            onSelectQuestion={onSend}
            suggestions={suggestions}
            disabled={loading}
          />
        )}

        {messages.length > 0 && (
          <div className="space-y-4 p-4">
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
            {loading && <TypingIndicator label="Looking up your shop data..." />}
          </div>
        )}

        {messages.length === 0 && loading && (
          <div className="p-4">
            <TypingIndicator label="Looking up your shop data..." />
          </div>
        )}
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

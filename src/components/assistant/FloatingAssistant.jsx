import { useAssistant } from "../../context/AssistantContext";
import AssistantButton from "./AssistantButton";
import AssistantPanel from "./AssistantPanel";

export default function FloatingAssistant() {
  const {
    isOpen,
    toggle,
    close,
    messages,
    input,
    setInput,
    loading,
    ask,
    suggestions,
    lowStockCount,
  } = useAssistant();

  return (
    <>
      <AssistantButton
        onClick={toggle}
        isOpen={isOpen}
        lowStockCount={lowStockCount}
      />
      <AssistantPanel
        isOpen={isOpen}
        onClose={close}
        onMinimize={close}
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSend={ask}
        loading={loading}
        suggestions={suggestions}
      />
    </>
  );
}

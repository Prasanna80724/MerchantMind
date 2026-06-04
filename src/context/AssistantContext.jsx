import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { getSuggestedQuestions, sendChatMessage } from "../services/aiService";
import { getInventory } from "../services/productService";
import FloatingAssistant from "../components/assistant/FloatingAssistant";

const AssistantContext = createContext(null);

let messageId = 0;
const nextId = () => ++messageId;

export const DEFAULT_SUGGESTIONS = [
  "Profit of this month",
  "Most sold item",
  "Top customer",
  "Inventory value",
  "Top 5 products by stock",
  "Sales this week",
  "Purchase orders pending approval",
];

export function AssistantProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [lowStockCount, setLowStockCount] = useState(0);

  const refreshLowStockCount = useCallback(async () => {
    try {
      const inventory = await getInventory();
      const count = (inventory || []).filter(
        (p) => Number(p.quantity) < Number(p.threshold || 0)
      ).length;
      setLowStockCount(count);
    } catch {
      setLowStockCount(0);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      setInput("");
      setIsOpen(false);
      setLowStockCount(0);
      return;
    }

    refreshLowStockCount();
    getSuggestedQuestions()
      .then((data) => {
        if (data.questions?.length) setSuggestions(data.questions);
      })
      .catch(() => {});

    const interval = setInterval(refreshLowStockCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshLowStockCount]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const ask = useCallback(
    async (text) => {
      const question = String(text || "").trim();
      if (!question || loading) return;

      setInput("");
      if (!isOpen) setIsOpen(true);
      setMessages((prev) => [...prev, { id: nextId(), role: "user", content: question }]);
      setLoading(true);

      try {
        const data = await sendChatMessage(question);
        const summary = data.summary || data.answer || "";
        const presentation =
          data.presentation ||
          (data.rowCount === 0 ? { type: "empty", rowCount: 0 } : null);

        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            summary,
            presentation,
            content: summary,
          },
        ]);
        refreshLowStockCount();
      } catch (err) {
        const msg = err.message || "Something went wrong. Please try again.";
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: msg, isError: true },
        ]);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [loading, isOpen, refreshLowStockCount]
  );

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      messages,
      input,
      setInput,
      loading,
      ask,
      suggestions,
      lowStockCount,
      refreshLowStockCount,
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      messages,
      input,
      loading,
      ask,
      suggestions,
      lowStockCount,
      refreshLowStockCount,
    ]
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      {isAuthenticated && <FloatingAssistant />}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return ctx;
}

export default AssistantContext;

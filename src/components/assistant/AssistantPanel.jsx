import { AnimatePresence, motion } from "framer-motion";
import { Minus, X } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function AssistantPanel({
  isOpen,
  onClose,
  onMinimize,
  messages,
  input,
  onInputChange,
  onSend,
  loading,
  suggestions,
}) {
  const showWelcome = messages.length === 0 && !loading;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[44] bg-slate-900/20 backdrop-blur-[1px] md:hidden"
            onClick={onMinimize}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[46] flex flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl
              inset-0 md:inset-auto
              md:bottom-24 md:right-6 md:h-[min(680px,calc(100vh-7rem))] md:w-[min(420px,calc(100vw-2rem))] md:max-h-[700px] md:rounded-2xl"
            role="dialog"
            aria-label="MerchantMind Assistant"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-3 text-white">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">MerchantMind Assistant</h2>
                <p className="truncate text-xs text-white/80">
                  Inventory, suppliers, sales & orders
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={onMinimize}
                  className="rounded-lg p-2 text-white/90 transition hover:bg-white/15"
                  aria-label="Minimize assistant"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-white/90 transition hover:bg-white/15 md:hidden"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <ChatWindow
              messages={messages}
              input={input}
              onInputChange={onInputChange}
              onSend={onSend}
              loading={loading}
              suggestions={suggestions}
              showWelcome={showWelcome}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

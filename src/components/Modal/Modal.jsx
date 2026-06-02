import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Button from "../Button/Button";

export default function Modal({ open, onClose, title, description, children, size = "md" }) {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full ${sizes[size]} rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-elevated)]`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
                    {title}
                  </h2>
                  {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ModalFooter({ children, className = "" }) {
  return <div className={`mt-6 flex flex-wrap justify-end gap-3 ${className}`}>{children}</div>;
}

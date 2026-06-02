import { cn } from "../../utils/cn";

export default function Card({ children, className, hover = false, glass = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 shadow-[var(--shadow-card)]",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]",
        glass && "glass",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={cn("text-base font-semibold text-slate-900", className)}>{children}</h3>;
}

export function CardDescription({ children, className }) {
  return <p className={cn("text-sm text-slate-500", className)}>{children}</p>;
}

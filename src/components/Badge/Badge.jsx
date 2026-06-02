import { cn } from "../../utils/cn";

const variants = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-success-light text-emerald-700",
  warning: "bg-warning-light text-amber-700",
  danger: "bg-danger-light text-red-700",
  brand: "bg-brand-100 text-brand-700",
};

export default function Badge({ children, variant = "default", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StockBadge({ quantity, threshold = 0 }) {
  const qty = Number(quantity) || 0;
  const th = Number(threshold) || 0;
  if (qty <= 0) return <Badge variant="danger">Out of stock</Badge>;
  if (th > 0 && qty <= th) return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">In stock</Badge>;
}

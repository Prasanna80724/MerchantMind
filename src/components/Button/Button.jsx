import { cn } from "../../utils/cn";

const variants = {
  primary:
    "gradient-brand text-white shadow-md shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/30 hover:brightness-105",
  secondary:
    "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-danger text-white hover:bg-red-600 shadow-sm",
  success: "bg-success text-white hover:bg-emerald-600 shadow-sm",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
};

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

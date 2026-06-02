import { cn } from "../../utils/cn";
import productPlaceholder from "../../assets/placeholders/product-placeholder.svg";

export default function ProductImage({ name, src, size = "md", className }) {
  const sizes = {
    sm: "h-10 w-10 rounded-lg",
    md: "h-12 w-12 rounded-xl",
    lg: "h-16 w-16 rounded-xl",
    xl: "h-24 w-24 rounded-2xl",
  };

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-slate-200 bg-slate-50",
        sizes[size],
        className
      )}
    >
      <img
        src={src || productPlaceholder}
        alt={name ? `${name} product` : "Product"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

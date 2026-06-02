import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

export default function SearchBar({ value, onChange, placeholder = "Search...", className, children }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      {children}
    </div>
  );
}

import { Link } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "../Button/Button";

export default function UserMenu({ collapsed = false, onLogout }) {
  const username = localStorage.getItem("username") || "User";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className={cn("border-t border-white/10 p-3", collapsed && "px-2")}>
      <div className={cn("mb-3 flex items-center gap-3", collapsed && "justify-center")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-brand-600/30">
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{username}</p>
            <p className="truncate text-xs text-slate-400">Merchant account</p>
          </div>
        )}
      </div>
      <Link
        to="/profile"
        title={collapsed ? "Company profile" : undefined}
        className={cn(
          "mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white",
          collapsed && "justify-center px-2"
        )}
      >
        <Settings className="h-4 w-4 shrink-0" />
        {!collapsed && "Company profile"}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className={cn(
          "w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white",
          collapsed && "justify-center px-2"
        )}
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && "Sign out"}
      </Button>
    </div>
  );
}

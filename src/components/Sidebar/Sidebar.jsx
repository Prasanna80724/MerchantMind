import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { cn } from "../../utils/cn";
import UserMenu from "../UserMenu/UserMenu";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Box },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/suppliers", label: "Suppliers", icon: Users },
  { to: "/purchase-orders", label: "Purchase Orders", icon: FileText },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { collapsed, toggle } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-slate-950 text-white shadow-xl"
    >
      <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && "justify-center")}>
        <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-brand shadow-lg shadow-brand-600/30">
            <Package className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="truncate text-lg font-bold tracking-tight">MerchantMind</span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-brand-200" : "text-slate-500 group-hover:text-brand-200"
                )}
              />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <motion.span
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        {!collapsed && "Collapse"}
      </button>

      <UserMenu collapsed={collapsed} onLogout={handleLogout} />
    </motion.aside>
  );
}

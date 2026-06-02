import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import Card from "../Card/Card";

const accentMap = {
  brand: "from-brand-500/10 to-violet-500/10 text-brand-600",
  success: "from-emerald-500/10 to-teal-500/10 text-success",
  warning: "from-amber-500/10 to-orange-500/10 text-warning",
  danger: "from-red-500/10 to-rose-500/10 text-danger",
  slate: "from-slate-500/10 to-slate-600/10 text-slate-600",
};

export default function StatCard({ title, value, subtitle, icon: Icon, accent = "brand", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card hover className="relative overflow-hidden">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", accentMap[accent])} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {Icon && (
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", accentMap[accent])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

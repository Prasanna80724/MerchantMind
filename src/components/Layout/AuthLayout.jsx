import { motion } from "framer-motion";
import { BarChart3, Package, Shield, Zap } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between gradient-brand p-12 text-white"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiKDI1NSwyNTUsMjU1KSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDgiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">MerchantMind</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Inventory management,
              <br />
              reimagined.
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80">
              Track products, suppliers, sales, and invoices in one modern workspace built for growing merchants.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              { icon: BarChart3, text: "Real-time analytics & revenue insights" },
              { icon: Shield, text: "Secure multi-user access with JWT auth" },
              { icon: Zap, text: "Automated low-stock alerts & invoicing" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/90">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} MerchantMind. All rights reserved.</p>
      </motion.div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="text-gradient text-2xl font-bold">MerchantMind</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

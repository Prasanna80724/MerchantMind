import Card, { CardHeader, CardTitle } from "../../Card/Card";

export default function ResponseShell({ title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <Card className={className}>
      <CardHeader className={Icon || subtitle ? "mb-3" : "mb-0"}>
        <div className="flex items-center gap-2">
          {Icon ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 text-brand-600">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}

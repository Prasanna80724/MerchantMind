import { Hash } from "lucide-react";
import ResponseShell from "./ResponseShell";

export default function CountResponse({ title, value, unit }) {
  const label = unit ? `${value} ${unit}` : String(value);

  return (
    <ResponseShell title={title} icon={Hash}>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{label}</p>
    </ResponseShell>
  );
}

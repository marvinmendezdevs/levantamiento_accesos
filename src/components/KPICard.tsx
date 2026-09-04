"use client";

interface KPICardProps {
  title: string;
  total: number;
  conAcceso: number;
  sinAcceso: number;
  pct: number;
  icon: string;
  color: "blue" | "green" | "amber";
  subtitle?: string;
}

const colorMap = {
  blue: {
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    pct: "text-blue-600",
    ring: "ring-blue-200",
  },
  green: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    pct: "text-emerald-600",
    ring: "ring-emerald-200",
  },
  amber: {
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    pct: "text-amber-600",
    ring: "ring-amber-200",
  },
};

export function KPICard({ title, total, conAcceso, sinAcceso, pct, icon, color, subtitle }: KPICardProps) {
  const c = colorMap[color];
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm ring-1 ${c.ring}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className={`text-4xl font-bold ${c.pct}`}>{pct}%</span>
        <span className="text-slate-400 text-sm mb-1">completado</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${c.bar} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-slate-700">{total.toLocaleString("es-SV")}</p>
          <p className="text-xs text-slate-400">Total base</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${c.pct}`}>{conAcceso.toLocaleString("es-SV")}</p>
          <p className="text-xs text-slate-400">Con acceso</p>
        </div>
        <div>
          <p className="text-lg font-bold text-red-400">{sinAcceso.toLocaleString("es-SV")}</p>
          <p className="text-xs text-slate-400">Pendientes</p>
        </div>
      </div>
    </div>
  );
}

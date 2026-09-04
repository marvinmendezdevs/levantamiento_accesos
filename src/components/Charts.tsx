"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface GrupoRow {
  grupo: string; total_ces: number; total_docentes: number; total_estudiantes: number;
  doc_acceso: number; est_acceso: number; pct_general: number;
}

function DonutRing({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const r = 44; const circ = 2 * Math.PI * r;
  const dash = Math.min((pct / 100) * circ, circ);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x="50" y="53" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1a202c">{pct}%</text>
    </svg>
  );
}

export function GruposChart({ fecha }: { fecha?: string | null }) {
  const [data, setData] = useState<GrupoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = fecha ? `/api/grupos?fecha=${fecha}` : "/api/grupos";
    setLoading(true);
    fetch(url).then(r => r.json()).then(j => { setData(j.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [fecha]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Cargando...</div>;
  if (!data.length) return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="grupo" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
          formatter={(v: number) => [`${v}%`, "Avance"]} />
        <Bar dataKey="pct_general" name="Avance general" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={Number(entry.pct_general) >= 80 ? "#10b981" : Number(entry.pct_general) >= 50 ? "#3b82f6" : Number(entry.pct_general) >= 20 ? "#f59e0b" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface StatsForDonut {
  docentes: { pct: number }; estudiantes: { pct: number }; centrosEscolares: { pct: number };
}

export function DonutsRow({ stats }: { stats: StatsForDonut }) {
  const items = [
    { label: "CEs con datos",       pct: stats.centrosEscolares.pct, color: "#3b82f6" },
    { label: "Docentes con acceso",  pct: stats.docentes.pct,         color: "#10b981" },
    { label: "Estudiantes con acceso", pct: stats.estudiantes.pct,    color: "#f59e0b" },
  ];
  return (
    <div className="flex justify-around items-center py-4">
      {items.map(item => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <DonutRing pct={item.pct} color={item.color} size={108} />
          <p className="text-xs text-slate-500 text-center font-medium max-w-20">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

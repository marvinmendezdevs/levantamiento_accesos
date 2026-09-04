"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface GrupoRow {
  grupo: string; total_ces: number; total_docentes: number; total_estudiantes: number;
  doc_acceso: number; est_acceso: number; pct_general: number;
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

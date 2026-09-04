"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/KPICard";
import { SchoolsTable } from "@/components/SchoolsTable";
import { GruposChart, DonutsRow } from "@/components/Charts";
import { CalendarPicker } from "@/components/CalendarPicker";

interface Stats {
  fechaReferencia: string | null;
  centrosEscolares: { total: number; conDatos: number; sinDatos: number; pct: number };
  docentes:         { total: number; conAcceso: number; sinAcceso: number; pct: number; cesConAcceso: number };
  estudiantes:      { total: number; conAcceso: number; sinAcceso: number; pct: number; cesConAcceso: number };
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-2xl p-5 text-center ${color}`}>
      <p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString("es-SV") : value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [fecha, setFecha] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = fecha ? `/api/stats?fecha=${fecha}` : "/api/stats";
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(j => { setStats(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [fecha]);

  const globalPct = stats
    ? Math.round(((stats.docentes.conAcceso + stats.estudiantes.conAcceso) /
        Math.max(stats.docentes.total + stats.estudiantes.total, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-800 text-lg">Resumen general</h1>
          <p className="text-xs text-slate-400">Levantamiento de datos de accesos · MINED</p>
        </div>
        {fecha && (
          <div className="bg-blue-50 px-4 py-2 rounded-xl text-right">
            <p className="text-xs text-blue-500 font-medium">Datos al</p>
            <p className="text-sm font-bold text-blue-700">
              {(() => {
                const [y,m,d] = fecha.split("-");
                const mes = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][parseInt(m)-1];
                return `${parseInt(d)} ${mes} ${y}`;
              })()}
            </p>
          </div>
        )}
      </header>

      <div className="flex gap-6 px-8 py-7">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-7">

          {/* No data warning */}
          {!loading && !stats?.fechaReferencia && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
              ⚠️ No hay datos de accesos. Corré{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">npm run db:seed</code> para importar el CSV inicial.
            </div>
          )}

          {stats && (
            <>
              {/* Quick chips */}
              <section id="resumen" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatChip label="Total CEs" value={stats.centrosEscolares.total}
                  color="bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm" />
                <StatChip label="CEs con datos" value={stats.centrosEscolares.conDatos}
                  color="bg-blue-600 text-white shadow-sm" />
                <StatChip label="CEs pendientes" value={stats.centrosEscolares.sinDatos}
                  color="bg-red-50 text-red-600 ring-1 ring-red-100" />
                <StatChip label="Avance global" value={`${globalPct}%`}
                  color="bg-violet-600 text-white shadow-sm" />
              </section>

              {/* KPI Cards */}
              <section id="docentes">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Avance por categoría</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <KPICard title="Centros Escolares" subtitle="CEs con al menos 1 acceso" icon="🏫"
                    total={stats.centrosEscolares.total} conAcceso={stats.centrosEscolares.conDatos}
                    sinAcceso={stats.centrosEscolares.sinDatos} pct={stats.centrosEscolares.pct} color="blue" />
                  <KPICard title="Docentes" subtitle={`${stats.docentes.cesConAcceso} CEs con docentes`} icon="👨‍🏫"
                    total={stats.docentes.total} conAcceso={stats.docentes.conAcceso}
                    sinAcceso={stats.docentes.sinAcceso} pct={stats.docentes.pct} color="green" />
                  <KPICard title="Estudiantes" subtitle={`${stats.estudiantes.cesConAcceso} CEs con estudiantes`} icon="🎒"
                    total={stats.estudiantes.total} conAcceso={stats.estudiantes.conAcceso}
                    sinAcceso={stats.estudiantes.sinAcceso} pct={stats.estudiantes.pct} color="amber" />
                </div>
              </section>

              {/* Charts */}
              <section id="grupos" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 mb-1">Avance por grupo</h2>
                  <p className="text-xs text-slate-400 mb-4">% de accesos del denominador base por grupo</p>
                  <GruposChart fecha={fecha} />
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/> ≥ 80%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/> 50–79%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/> 20–49%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"/> &lt; 20%</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 mb-1">Cobertura general</h2>
                  <p className="text-xs text-slate-400 mb-2">% del denominador base cubierto</p>
                  <DonutsRow stats={stats} />
                </div>
              </section>
            </>
          )}

          {/* Schools table */}
          <section id="escuelas">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Detalle por centro escolar</h2>
            <SchoolsTable fecha={fecha} />
          </section>
        </div>

        {/* Right panel: Calendar */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">Fecha</p>
            <CalendarPicker onDateChange={setFecha} />
          </div>
        </div>
      </div>
    </div>
  );
}

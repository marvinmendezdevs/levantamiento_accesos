"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CalendarPicker } from "@/components/CalendarPicker";
import { KPICard } from "@/components/KPICard";
import { SchoolsTable } from "@/components/SchoolsTable";
import { GruposChart } from "@/components/Charts";

interface Stats {
  fechaReferencia: string | null;
  centrosEscolares: { total: number; conDatos: number; sinDatos: number; pct: number; completados: number };
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

function formatDate(fecha: string) {
  const [y, m, d] = fecha.split("-");
  const mes = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][parseInt(m)-1];
  return `${parseInt(d)} ${mes} ${y}`;
}

export default function DashboardPage() {
  const [fecha, setFecha] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [gruposDisponibles, setGruposDisponibles] = useState<string[]>([]);
  const [intervenidoFiltro, setIntervenidoFiltro] = useState("");

  // Lista de grupos para el filtro (tantos como existan en centros_escolares.grupo)
  useEffect(() => {
    fetch("/api/grupos")
      .then(r => r.json())
      .then(j => {
        const lista = (j.data ?? []).map((r: { grupo: string }) => r.grupo).filter(Boolean).sort();
        setGruposDisponibles(lista);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fecha) params.set("fecha", fecha);
    if (grupoFiltro) params.set("grupo", grupoFiltro);
    if (intervenidoFiltro) params.set("intervenido", intervenidoFiltro);
    const qs = params.toString();
    fetch(`/api/stats${qs ? `?${qs}` : ""}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { setStats(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [fecha, grupoFiltro, intervenidoFiltro]);

  const globalPct = stats
    ? Math.round(((stats.docentes.conAcceso + stats.estudiantes.conAcceso) /
        Math.max(stats.docentes.total + stats.estudiantes.total, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar fijo — solo visible en lg+ */}
      <Sidebar />

      {/* Todo el contenido: sin margen en móvil, ml-56 en lg+ */}
      <div className="lg:ml-56 min-h-screen flex flex-col">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-800 text-base leading-tight">Reporte de Accesos</h1>
            <p className="text-xs text-slate-400">Nueva Escalada · Levantamiento de datos</p>
          </div>
          {stats?.fechaReferencia && (
            <div className="bg-blue-50 px-3 py-2 rounded-xl text-right">
              <p className="text-xs text-blue-500 font-medium">Datos al</p>
              <p className="text-sm font-bold text-blue-700">{formatDate(stats.fechaReferencia)}</p>
            </div>
          )}
        </header>

        {/* Cuerpo principal */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          {/*
            En móvil: columna única (content arriba, calendario abajo)
            En xl+:   fila — content flex-1 | calendario w-56 sticky
          */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">

            {/* ── Contenido principal ── */}
            <div className="w-full xl:flex-1 min-w-0 space-y-7">

              {/* Sin datos */}
              {!loading && !stats?.fechaReferencia && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
                  ⚠️ No hay datos de accesos. Corré{" "}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">npm run db:seed</code> para importar el CSV inicial.
                </div>
              )}

              {stats && (
                <>
                  {/* Filtros globales: grupo e intervenido */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="grupo-filtro" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        Filtrar por grupo
                      </label>
                      <select
                        id="grupo-filtro"
                        value={grupoFiltro}
                        onChange={e => setGrupoFiltro(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        <option value="">Todos los grupos</option>
                        {gruposDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label htmlFor="intervenido-filtro" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        Intervenido
                      </label>
                      <select
                        id="intervenido-filtro"
                        value={intervenidoFiltro}
                        onChange={e => setIntervenidoFiltro(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        <option value="">Todos</option>
                        <option value="si">Solo intervenidos</option>
                        <option value="no">Solo no intervenidos</option>
                      </select>
                    </div>
                  </div>

                  {/* Chips de resumen */}
                  <section id="resumen" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatChip label="Total Centros Escolares" value={stats.centrosEscolares.total}
                      color="bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm" />
                    <StatChip label="Centros Escolares con al menos un acceso" value={stats.centrosEscolares.conDatos}
                      color="bg-blue-600 text-white shadow-sm" />
                    <StatChip label="Centros Escolares pendientes" value={stats.centrosEscolares.sinDatos}
                      color="bg-red-50 text-red-600 ring-1 ring-red-100" />
                    <StatChip label="Centros Escolares completados (100%+)" value={stats.centrosEscolares.completados}
                      color="bg-emerald-600 text-white shadow-sm" />
                  </section>

                  {/* KPI Cards */}
                  <section id="docentes">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Avance por categoría</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <KPICard title="Centros Escolares" subtitle="Con al menos un acceso registrado" icon="🏫"
                        total={stats.centrosEscolares.total} conAcceso={stats.centrosEscolares.conDatos}
                        sinAcceso={stats.centrosEscolares.sinDatos} pct={stats.centrosEscolares.pct} color="blue" />
                      <KPICard title="Docentes" subtitle={`${stats.docentes.cesConAcceso} Centros Escolares con docentes`} icon="👨‍🏫"
                        total={stats.docentes.total} conAcceso={stats.docentes.conAcceso}
                        sinAcceso={stats.docentes.sinAcceso} pct={stats.docentes.pct} color="green" />
                      <KPICard title="Estudiantes" subtitle={`${stats.estudiantes.cesConAcceso} Centros Escolares con estudiantes`} icon="🎒"
                        total={stats.estudiantes.total} conAcceso={stats.estudiantes.conAcceso}
                        sinAcceso={stats.estudiantes.sinAcceso} pct={stats.estudiantes.pct} color="amber" />
                    </div>
                  </section>

                  {/* Gráfico */}
                  <section id="grupos">
                    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
                      <h2 className="font-semibold text-slate-800 mb-1">Avance por grupo</h2>
                      <p className="text-xs text-slate-400 mb-4">% del denominador base por grupo</p>
                      <GruposChart fecha={fecha} intervenido={intervenidoFiltro} />
                    </div>
                  </section>
                </>
              )}

              {/* Tabla de escuelas */}
              <section id="escuelas">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Detalle por centro escolar</h2>
                <SchoolsTable fecha={fecha} grupo={grupoFiltro} intervenido={intervenidoFiltro} />
              </section>
            </div>

            {/* ── Calendario ── derecha en xl+, abajo en móvil */}
            <div className="w-full xl:w-56 xl:shrink-0 xl:sticky xl:top-20 space-y-4">
              <CalendarPicker onDateChange={setFecha} />

              {/* Avance global de usuarios — estático, informativo */}
              {stats && (
                <div className="bg-blue-600 rounded-2xl p-5 text-center text-white shadow-sm">
                  <p className="text-3xl font-bold">{globalPct}%</p>
                  <p className="text-xs mt-1 opacity-90">Avance global de usuarios</p>
                </div>
              )}
            </div>

          </div>
        </div>

        <footer className="px-4 sm:px-8 py-5 text-center text-xs text-slate-400 border-t border-slate-200">
          Reporte de Accesos · Nueva Escalada · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

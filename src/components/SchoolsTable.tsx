"use client";

import { useState, useEffect, useCallback } from "react";

interface School {
  code: string; nombre: string; grupo: string;
  totalDocentes: number; totalEstudiantes: number;
  docentesConAcceso: number; estudiantesConAcceso: number;
  pctDocentes: number; pctEstudiantes: number; pct_general: number;
}
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const ESTADOS = [
  { value: "",             label: "Todos los estados" },
  { value: "sin_datos",   label: "🔴 Sin datos" },
  { value: "parcial",     label: "🟡 Parcial (< 50%)" },
  { value: "en_progreso", label: "🔵 En progreso (50–99%)" },
  { value: "completo",    label: "🟢 Completo (≥ 100%)" },
];

function MiniBar({ pct, color }: { pct: number; color: string }) {
  const overHundred = pct > 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-medium w-12 text-right whitespace-nowrap ${overHundred ? "text-violet-600 font-bold" : "text-slate-600"}`}>
        {pct}%{overHundred ? " ✦" : ""}
      </span>
    </div>
  );
}

function StatusBadge({ pct }: { pct: number }) {
  if (pct === 0)    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-medium whitespace-nowrap">Sin datos</span>;
  if (pct < 50)     return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-600 font-medium whitespace-nowrap">Parcial</span>;
  if (pct < 100)    return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600 font-medium whitespace-nowrap">En progreso</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-600 font-medium whitespace-nowrap">✓ Completo</span>;
}

interface Props { fecha?: string | null; grupo?: string; }

export function SchoolsTable({ fecha, grupo = "" }: Props) {
  const [schools, setSchools]       = useState<School[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [estado, setEstado]         = useState("");
  const [loading, setLoading]       = useState(true);

  const fetchSchools = useCallback(async (page: number, q: string, g: string, e: string, f: string | null | undefined) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: "10",
        search: q, grupo: g, estado: e,
        ...(f ? { fecha: f } : {}),
      });
      const res  = await fetch(`/api/schools?${params}`);
      const json = await res.json();
      setSchools(json.data ?? []);
      setPagination(json.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 });
    } finally { setLoading(false); }
  }, []);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // el filtro de grupo viene del padre (dashboard): al cambiar, volvemos a página 1
  useEffect(() => { setPagination(p => ({ ...p, page: 1 })); }, [grupo]);

  useEffect(() => {
    fetchSchools(pagination.page, search, grupo, estado, fecha);
  }, [pagination.page, search, grupo, estado, fecha]);

  // reset page on filter change
  const setFilter = (fn: () => void) => { fn(); setPagination(p => ({ ...p, page: 1 })); };

  const goTo = (p: number) => setPagination(prev => ({ ...prev, page: Math.max(1, Math.min(p, prev.totalPages)) }));

  return (
    <div id="escuelas" className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* Header + filters */}
      <div className="px-6 py-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">Centros Escolares</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {pagination.total.toLocaleString("es-SV")} centros · ordenado por avance general
            </p>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text" placeholder="🔍 Buscar por nombre..."
            className="flex-1 min-w-48 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          />
          <select
            value={estado} onChange={e => setFilter(() => setEstado(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          {(search || estado) && (
            <button onClick={() => { setFilter(() => { setSearchInput(""); setSearch(""); setEstado(""); }); }}
              className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50">
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Nota >100% */}
        <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 text-xs text-violet-700">
          <span className="mt-0.5">✦</span>
          <span>
            <strong>¿Por qué algunos superan el 100%?</strong> El denominador viene de SIGES al momento del levantamiento.
            Algunas escuelas tenían 0 docentes porque la asignación de secciones aún no estaba registrada en SIGES.
            Si durante el operativo se encontraron o registraron más participantes que los que constaban originalmente,
            el porcentaje puede superar el 100%. Eso es esperado y válido.
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Centro Escolar</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Grupo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44">Docentes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44">Estudiantes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44">Avance general</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-50 transition-opacity ${loading ? "opacity-40" : "opacity-100"}`}>
            {schools.length === 0 && !loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">No se encontraron centros escolares.</td></tr>
            )}
            {schools.map((s, idx) => {
              const rank = (pagination.page - 1) * pagination.limit + idx + 1;
              const pctGen = Number(s.pct_general);
              return (
                <tr key={s.code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{rank}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 leading-tight">{s.nombre}</p>
                    <p className="text-xs text-slate-400 font-mono">{s.code}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-lg text-xs bg-violet-100 text-violet-700 font-semibold whitespace-nowrap">{s.grupo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">{s.docentesConAcceso}/{s.totalDocentes}</p>
                    <MiniBar pct={Number(s.pctDocentes)} color="bg-blue-400" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">{s.estudiantesConAcceso}/{s.totalEstudiantes}</p>
                    <MiniBar pct={Number(s.pctEstudiantes)} color="bg-emerald-400" />
                  </td>
                  <td className="px-4 py-3">
                    <MiniBar pct={pctGen} color={pctGen >= 100 ? "bg-emerald-500" : pctGen >= 50 ? "bg-blue-400" : pctGen > 0 ? "bg-amber-400" : "bg-red-300"} />
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge pct={pctGen} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm">
        <p className="text-xs text-slate-400">
          {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit, pagination.total)} de {pagination.total.toLocaleString("es-SV")}
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => goTo(1)} disabled={pagination.page===1} className="px-2 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600">«</button>
          <button onClick={() => goTo(pagination.page-1)} disabled={pagination.page===1} className="px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600">‹ Ant.</button>
          <span className="px-3 py-1.5 text-slate-500 text-xs">{pagination.page} / {pagination.totalPages}</span>
          <button onClick={() => goTo(pagination.page+1)} disabled={pagination.page===pagination.totalPages} className="px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600">Sig. ›</button>
          <button onClick={() => goTo(pagination.totalPages)} disabled={pagination.page===pagination.totalPages} className="px-2 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600">»</button>
        </div>
      </div>
    </div>
  );
}

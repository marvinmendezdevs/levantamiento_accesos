"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS  = ["D","L","M","M","J","V","S"];

interface CalendarPickerProps {
  onDateChange: (fecha: string | null) => void;
}

export function CalendarPicker({ onDateChange }: CalendarPickerProps) {
  const [fechasDisponibles, setFechasDisponibles] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewYear, setViewYear]   = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetch("/api/fechas")
      .then(r => r.json())
      .then(j => {
        const set = new Set<string>(j.fechas ?? []);
        setFechasDisponibles(set);
        // auto-select latest
        if (j.fechas?.length) {
          const latest = j.fechas[0]; // already DESC
          setSelectedDate(latest);
          onDateChange(latest);
          const [y, m] = latest.split("-").map(Number);
          setViewYear(y); setViewMonth(m - 1);
        }
      });
  }, []);

  const select = (dateStr: string) => {
    if (!fechasDisponibles.has(dateStr)) return;
    setSelectedDate(dateStr);
    onDateChange(dateStr);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstWeekday(viewYear, viewMonth);

  const formatDisplay = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${parseInt(d)} ${MESES[parseInt(m)-1].slice(0,3)} ${y}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">‹</button>
        <span className="text-sm font-semibold text-slate-700">{MESES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const available = fechasDisponibles.has(iso);
          const selected  = iso === selectedDate;
          return (
            <button
              key={day}
              onClick={() => select(iso)}
              disabled={!available}
              className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium transition-colors
                ${selected  ? "bg-blue-600 text-white shadow"         : ""}
                ${!selected && available  ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : ""}
                ${!available ? "text-slate-300 cursor-default"         : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected display */}
      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">Fecha seleccionada</p>
          <p className="text-sm font-semibold text-blue-700 mt-0.5">{formatDisplay(selectedDate)}</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 inline-block ring-1 ring-blue-200"/>Con datos</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block"/>Seleccionado</span>
      </div>
    </div>
  );
}

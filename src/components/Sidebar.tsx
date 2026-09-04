"use client";

const nav = [
  { href: "#resumen",   icon: "📊", label: "Resumen general" },
  { href: "#docentes",  icon: "👨‍🏫", label: "Docentes" },
  { href: "#grupos",    icon: "🗂️",  label: "Por grupo" },
  { href: "#escuelas",  icon: "🏫", label: "Centros escolares" },
];

export function Sidebar() {
  const scrollTo = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 flex-col z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">ME</div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Reporte</p>
            <p className="text-xs text-slate-400">Nueva Escalada</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2 mb-3">Secciones</p>
        {nav.map((item) => (
          <button
            key={item.href}
            onClick={() => scrollTo(item.href)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-left"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100 shrink-0">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Reporte de Accesos</p>
      </div>
    </aside>
  );
}

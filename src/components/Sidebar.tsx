"use client";

const nav = [
  { href: "#resumen",   icon: "📊", label: "Resumen general" },
  { href: "#docentes",  icon: "👨‍🏫", label: "Docentes" },
  { href: "#grupos",    icon: "🗂️",  label: "Por grupo" },
  { href: "#escuelas",  icon: "🏫", label: "Centros escolares" },
];

export function Sidebar() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-slate-200 flex flex-col z-20">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">ME</div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">Tablero</p>
            <p className="text-xs text-slate-400">MINED · Accesos</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
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

      <div className="px-5 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} MINED El Salvador</p>
      </div>
    </aside>
  );
}

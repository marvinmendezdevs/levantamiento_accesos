import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Tablero de Accesos — MINED",
  description: "Seguimiento de accesos de docentes y estudiantes por centro escolar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 font-sans antialiased">
        <Sidebar />
        <div className="ml-56">
          {children}
        </div>
      </body>
    </html>
  );
}

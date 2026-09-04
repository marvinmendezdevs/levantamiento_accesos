import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reporte de Accesos — Nueva Escalada",
  description: "Seguimiento de accesos de docentes y estudiantes por centro escolar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

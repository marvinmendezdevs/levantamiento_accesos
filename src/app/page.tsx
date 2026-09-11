// Server Component: fuerza render dinámico en cada request — un componente
// "use client" puro se optimiza como página estática y Next le pone su
// propio Cache-Control (s-maxage=31536000, un año) sin importar lo que
// digamos en next.config.js. Envolviéndolo en un Server Component con
// `dynamic = "force-dynamic"` sí lo saca de esa ruta de cacheo estático.
export const dynamic = "force-dynamic";

import DashboardClient from "./DashboardClient";

export default function Page() {
  return <DashboardClient />;
}

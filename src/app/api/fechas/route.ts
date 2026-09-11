import { neon } from "@neondatabase/serverless";
import { noCacheJson } from "@/lib/noCache";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT DISTINCT fecha::text AS fecha
      FROM accesos_diarios
      ORDER BY fecha DESC
    `;
    return noCacheJson({ fechas: rows.map(r => r.fecha) });
  } catch (e) {
    return noCacheJson({ fechas: [] });
  }
}

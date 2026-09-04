import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
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
    return NextResponse.json({ fechas: rows.map(r => r.fecha) });
  } catch (e) {
    return NextResponse.json({ fechas: [] });
  }
}

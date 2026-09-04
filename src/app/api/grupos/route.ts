import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");
    const fechaRes = await sql`SELECT MAX(fecha)::text AS last_date FROM accesos_diarios`;
    const lastDate = fechaParam ?? fechaRes[0]?.last_date ?? null;

    const rows = await sql`
      SELECT ce.grupo,
        COUNT(*)::int AS total_ces,
        SUM(ce.total_docentes)::int AS total_docentes,
        SUM(ce.total_estudiantes)::int AS total_estudiantes,
        COALESCE(SUM(ad.docentes_con_acceso),0)::int    AS doc_acceso,
        COALESCE(SUM(ad.estudiantes_con_acceso),0)::int AS est_acceso,
        CASE WHEN SUM(ce.total_docentes + ce.total_estudiantes) > 0
          THEN ROUND(
            LEAST(
              (COALESCE(SUM(ad.docentes_con_acceso),0) + COALESCE(SUM(ad.estudiantes_con_acceso),0))
              * 100.0 / NULLIF(SUM(ce.total_docentes + ce.total_estudiantes),0),
              100)
            , 1)
          ELSE 0 END AS pct_general
      FROM centros_escolares ce
      LEFT JOIN accesos_diarios ad ON ad.centro_escolar_code = ce.code AND ad.fecha = ${lastDate}
      GROUP BY ce.grupo ORDER BY pct_general DESC`;

    return NextResponse.json({ data: rows, fechaReferencia: lastDate });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

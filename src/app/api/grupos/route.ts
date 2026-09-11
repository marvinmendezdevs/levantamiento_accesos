import { neon } from "@neondatabase/serverless";
import { noCacheJson } from "@/lib/noCache";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");
    const intervenido = searchParams.get("intervenido") ?? ""; // "" | "si" | "no"
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
      WHERE (
        ${intervenido} = ''
        OR (${intervenido} = 'si' AND ce.intervenido = true)
        OR (${intervenido} = 'no' AND ce.intervenido = false)
      )
      GROUP BY ce.grupo ORDER BY pct_general DESC`;

    return noCacheJson({ data: rows, fechaReferencia: lastDate });
  } catch (e) { return noCacheJson({ error: String(e) }, 500); }
}

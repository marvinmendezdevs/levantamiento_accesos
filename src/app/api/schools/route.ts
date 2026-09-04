import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.max(1, parseInt(searchParams.get("limit") ?? "10"));
    const search = searchParams.get("search") ?? "";
    const grupo  = searchParams.get("grupo")  ?? "";
    const estado = searchParams.get("estado") ?? "";
    const offset = (page - 1) * limit;

    // Siempre usar la última fecha disponible como base
    const fechaRes = await sql`SELECT MAX(fecha)::text AS last_date FROM accesos_diarios`;
    const lastDate = searchParams.get("fecha") ?? fechaRes[0]?.last_date ?? null;

    // Estado → rango de pct
    const estadoSQL =
      estado === "sin_datos"    ? "AND sub.pct_general = 0"                    :
      estado === "parcial"      ? "AND sub.pct_general > 0 AND sub.pct_general < 50"  :
      estado === "en_progreso"  ? "AND sub.pct_general >= 50 AND sub.pct_general < 100" :
      estado === "completo"     ? "AND sub.pct_general >= 100"                 : "";

    // CTE base con pct calculado → luego filtramos encima
    const rows = await sql.unsafe(`
      WITH base AS (
        SELECT
          ce.code, ce.nombre, ce.grupo,
          ce.total_docentes                                           AS "totalDocentes",
          ce.total_estudiantes                                        AS "totalEstudiantes",
          COALESCE(ad.docentes_con_acceso,   0)                      AS "docentesConAcceso",
          COALESCE(ad.estudiantes_con_acceso, 0)                     AS "estudiantesConAcceso",
          CASE WHEN ce.total_docentes > 0
            THEN ROUND(COALESCE(ad.docentes_con_acceso,0) * 100.0 / ce.total_docentes, 1)
            ELSE 0 END                                               AS "pctDocentes",
          CASE WHEN ce.total_estudiantes > 0
            THEN ROUND(COALESCE(ad.estudiantes_con_acceso,0) * 100.0 / ce.total_estudiantes, 1)
            ELSE 0 END                                               AS "pctEstudiantes",
          CASE WHEN (ce.total_docentes + ce.total_estudiantes) > 0
            THEN ROUND(
              (COALESCE(ad.docentes_con_acceso,0) + COALESCE(ad.estudiantes_con_acceso,0))
              * 100.0 / (ce.total_docentes + ce.total_estudiantes), 1)
            ELSE 0 END                                               AS pct_general
        FROM centros_escolares ce
        LEFT JOIN accesos_diarios ad
          ON ad.centro_escolar_code = ce.code AND ad.fecha = $1
      )
      SELECT * FROM base sub
      WHERE
        ($2 = '' OR UPPER(sub.nombre) LIKE UPPER('%' || $2 || '%'))
        AND ($3 = '' OR sub.grupo = $3)
        ${estadoSQL}
      ORDER BY sub.pct_general DESC, sub.nombre ASC
      LIMIT $4 OFFSET $5
    `, [lastDate, search, grupo, limit, offset]);

    const countRes = await sql.unsafe(`
      WITH base AS (
        SELECT
          ce.code, ce.nombre, ce.grupo,
          CASE WHEN (ce.total_docentes + ce.total_estudiantes) > 0
            THEN ROUND(
              (COALESCE(ad.docentes_con_acceso,0) + COALESCE(ad.estudiantes_con_acceso,0))
              * 100.0 / (ce.total_docentes + ce.total_estudiantes), 1)
            ELSE 0 END AS pct_general
        FROM centros_escolares ce
        LEFT JOIN accesos_diarios ad
          ON ad.centro_escolar_code = ce.code AND ad.fecha = $1
      )
      SELECT COUNT(*)::int AS total FROM base sub
      WHERE
        ($2 = '' OR UPPER(sub.nombre) LIKE UPPER('%' || $2 || '%'))
        AND ($3 = '' OR sub.grupo = $3)
        ${estadoSQL}
    `, [lastDate, search, grupo]);

    const gruposRes = await sql`SELECT DISTINCT grupo FROM centros_escolares ORDER BY grupo`;

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(countRes[0].total), totalPages: Math.ceil(Number(countRes[0].total) / limit) },
      fechaReferencia: lastDate,
      grupos: gruposRes.map(r => r.grupo),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

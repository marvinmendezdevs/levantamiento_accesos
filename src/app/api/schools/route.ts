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

    const fechaRes = await sql`SELECT MAX(fecha)::text AS last_date FROM accesos_diarios`;
    const lastDate: string | null = searchParams.get("fecha") ?? fechaRes[0]?.last_date ?? null;

    const searchWild = `%${search}%`;

    // Grupos para el dropdown (sin filtro de fecha)
    const gruposRes = await sql`SELECT DISTINCT grupo FROM centros_escolares WHERE grupo IS NOT NULL ORDER BY grupo`;

    // Si no hay fecha disponible aún, devolvemos todos los CEs con acceso = 0
    if (!lastDate) {
      const baseRows = await sql`
        SELECT
          ce.code, ce.nombre, ce.grupo,
          ce.total_docentes    AS "totalDocentes",
          ce.total_estudiantes AS "totalEstudiantes",
          0 AS "docentesConAcceso",
          0 AS "estudiantesConAcceso",
          0 AS "pctDocentes",
          0 AS "pctEstudiantes",
          0 AS pct_general
        FROM centros_escolares ce
        WHERE
          (${search} = '' OR UPPER(ce.nombre) LIKE UPPER(${searchWild}))
          AND (${grupo} = '' OR ce.grupo = ${grupo})
        ORDER BY ce.nombre ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const countRes = await sql`
        SELECT COUNT(*)::int AS total FROM centros_escolares
        WHERE (${search} = '' OR UPPER(nombre) LIKE UPPER(${searchWild}))
          AND (${grupo} = '' OR grupo = ${grupo})
      `;
      return NextResponse.json({
        data: baseRows,
        pagination: { page, limit, total: countRes[0]?.total ?? 0, totalPages: Math.ceil((countRes[0]?.total ?? 0) / limit) },
        fechaReferencia: null,
        grupos: gruposRes.map((r: Record<string, unknown>) => r.grupo as string),
      });
    }

    // Con fecha: CTE para poder filtrar por pct_general en el WHERE externo
    const rows = await sql`
      WITH base AS (
        SELECT
          ce.code,
          ce.nombre,
          ce.grupo,
          ce.total_docentes                                            AS "totalDocentes",
          ce.total_estudiantes                                         AS "totalEstudiantes",
          COALESCE(ad.docentes_con_acceso,    0)                      AS "docentesConAcceso",
          COALESCE(ad.estudiantes_con_acceso, 0)                      AS "estudiantesConAcceso",
          CASE WHEN ce.total_docentes > 0
            THEN ROUND(COALESCE(ad.docentes_con_acceso,0) * 100.0 / ce.total_docentes, 1)
            ELSE 0 END                                                AS "pctDocentes",
          CASE WHEN ce.total_estudiantes > 0
            THEN ROUND(COALESCE(ad.estudiantes_con_acceso,0) * 100.0 / ce.total_estudiantes, 1)
            ELSE 0 END                                                AS "pctEstudiantes",
          CASE WHEN (ce.total_docentes + ce.total_estudiantes) > 0
            THEN ROUND(
              (COALESCE(ad.docentes_con_acceso,0) + COALESCE(ad.estudiantes_con_acceso,0))
              * 100.0 / (ce.total_docentes + ce.total_estudiantes), 1)
            ELSE 0 END                                                AS pct_general
        FROM centros_escolares ce
        LEFT JOIN accesos_diarios ad
          ON ad.centro_escolar_code = ce.code AND ad.fecha = ${lastDate}::date
      )
      SELECT * FROM base
      WHERE
        (${search} = '' OR UPPER(nombre) LIKE UPPER(${searchWild}))
        AND (${grupo} = '' OR grupo = ${grupo})
        AND (
          ${estado} = ''
          OR (${estado} = 'sin_datos'    AND pct_general = 0)
          OR (${estado} = 'parcial'      AND pct_general > 0   AND pct_general < 50)
          OR (${estado} = 'en_progreso'  AND pct_general >= 50  AND pct_general < 100)
          OR (${estado} = 'completo'     AND pct_general >= 100)
        )
      ORDER BY pct_general DESC, nombre ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRes = await sql`
      WITH base AS (
        SELECT
          ce.nombre, ce.grupo,
          CASE WHEN (ce.total_docentes + ce.total_estudiantes) > 0
            THEN ROUND(
              (COALESCE(ad.docentes_con_acceso,0) + COALESCE(ad.estudiantes_con_acceso,0))
              * 100.0 / (ce.total_docentes + ce.total_estudiantes), 1)
            ELSE 0 END AS pct_general
        FROM centros_escolares ce
        LEFT JOIN accesos_diarios ad
          ON ad.centro_escolar_code = ce.code AND ad.fecha = ${lastDate}::date
      )
      SELECT COUNT(*)::int AS total FROM base
      WHERE
        (${search} = '' OR UPPER(nombre) LIKE UPPER(${searchWild}))
        AND (${grupo} = '' OR grupo = ${grupo})
        AND (
          ${estado} = ''
          OR (${estado} = 'sin_datos'    AND pct_general = 0)
          OR (${estado} = 'parcial'      AND pct_general > 0   AND pct_general < 50)
          OR (${estado} = 'en_progreso'  AND pct_general >= 50  AND pct_general < 100)
          OR (${estado} = 'completo'     AND pct_general >= 100)
        )
    `;

    return NextResponse.json({
      data: rows,
      pagination: {
        page, limit,
        total: Number(countRes[0]?.total ?? 0),
        totalPages: Math.ceil(Number(countRes[0]?.total ?? 0) / limit),
      },
      fechaReferencia: lastDate,
      grupos: gruposRes.map((r: Record<string, unknown>) => r.grupo as string),
    });
  } catch (e) {
    console.error("schools API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

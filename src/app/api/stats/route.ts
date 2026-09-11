import { neon } from "@neondatabase/serverless";
import { noCacheJson } from "@/lib/noCache";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");
    const grupo = searchParams.get("grupo") ?? "";
    const intervenido = searchParams.get("intervenido") ?? ""; // "" | "si" | "no"

    const fechaRes = await sql`SELECT MAX(fecha)::text AS last_date FROM accesos_diarios`;
    const lastDate = fechaParam ?? fechaRes[0]?.last_date ?? null;

    const base = await sql`
      SELECT COUNT(*)::int AS total_ces,
             SUM(total_docentes)::int AS total_docentes,
             SUM(total_estudiantes)::int AS total_estudiantes
      FROM centros_escolares
      WHERE (${grupo} = '' OR grupo = ${grupo})
        AND (
          ${intervenido} = ''
          OR (${intervenido} = 'si' AND intervenido = true)
          OR (${intervenido} = 'no' AND intervenido = false)
        )`;

    if (!lastDate) {
      const t = base[0];
      return noCacheJson({
        fechaReferencia: null,
        centrosEscolares: { total: t.total_ces,       conDatos: 0, sinDatos: t.total_ces,       pct: 0, completados: 0 },
        docentes:         { total: t.total_docentes,  conAcceso: 0, sinAcceso: t.total_docentes, pct: 0, cesConAcceso: 0 },
        estudiantes:      { total: t.total_estudiantes, conAcceso: 0, sinAcceso: t.total_estudiantes, pct: 0, cesConAcceso: 0 },
      });
    }

    // JOIN con centros_escolares: necesitamos el total por CE (docentes+estudiantes)
    // para saber cuáles llegaron al 100%, y para poder filtrar por grupo.
    const acc = await sql`
      SELECT
        COALESCE(SUM(ad.docentes_con_acceso),0)::int     AS doc_acceso,
        COALESCE(SUM(ad.estudiantes_con_acceso),0)::int  AS est_acceso,
        COUNT(CASE WHEN ad.docentes_con_acceso   > 0 THEN 1 END)::int AS ces_doc,
        COUNT(CASE WHEN ad.estudiantes_con_acceso > 0 THEN 1 END)::int AS ces_est,
        COUNT(CASE WHEN ad.docentes_con_acceso > 0 OR ad.estudiantes_con_acceso > 0 THEN 1 END)::int AS ces_con_datos,
        -- Completado: llegó al 100% de su base, o no tenía base (0) pero sí reportó acceso.
        COUNT(CASE WHEN
          ((ce.total_docentes + ce.total_estudiantes) > 0
            AND (COALESCE(ad.docentes_con_acceso,0) + COALESCE(ad.estudiantes_con_acceso,0))
              >= (ce.total_docentes + ce.total_estudiantes))
          OR ((ce.total_docentes + ce.total_estudiantes) = 0
            AND (COALESCE(ad.docentes_con_acceso,0) + COALESCE(ad.estudiantes_con_acceso,0)) > 0)
        THEN 1 END)::int AS ces_completados
      FROM accesos_diarios ad
      JOIN centros_escolares ce ON ce.code = ad.centro_escolar_code
      WHERE ad.fecha = ${lastDate}
        AND (${grupo} = '' OR ce.grupo = ${grupo})
        AND (
          ${intervenido} = ''
          OR (${intervenido} = 'si' AND ce.intervenido = true)
          OR (${intervenido} = 'no' AND ce.intervenido = false)
        )`;

    const tot = base[0]; const a = acc[0];
    return noCacheJson({
      fechaReferencia: lastDate,
      centrosEscolares: { total: tot.total_ces, conDatos: a.ces_con_datos, sinDatos: tot.total_ces - a.ces_con_datos,
        pct: tot.total_ces > 0 ? Math.round(a.ces_con_datos * 100 / tot.total_ces) : 0, completados: a.ces_completados },
      docentes: { total: tot.total_docentes, conAcceso: a.doc_acceso, sinAcceso: tot.total_docentes - a.doc_acceso,
        pct: tot.total_docentes > 0 ? Math.round(a.doc_acceso * 100 / tot.total_docentes) : 0, cesConAcceso: a.ces_doc },
      estudiantes: { total: tot.total_estudiantes, conAcceso: a.est_acceso, sinAcceso: tot.total_estudiantes - a.est_acceso,
        pct: tot.total_estudiantes > 0 ? Math.round(a.est_acceso * 100 / tot.total_estudiantes) : 0, cesConAcceso: a.ces_est },
    });
  } catch (e) { return noCacheJson({ error: String(e) }, 500); }
}

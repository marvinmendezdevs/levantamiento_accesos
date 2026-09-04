import { NextResponse } from "next/server";
import { db } from "@/db";
import { accesosDiarios } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    /**
     * Payload esperado:
     * {
     *   fecha: "2026-09-05",       // ISO date
     *   registros: [
     *     { code: "10005", docentesConAcceso: 3, estudiantesConAcceso: 45 },
     *     ...
     *   ]
     * }
     */
    const { fecha, registros } = body as {
      fecha: string;
      registros: Array<{
        code: string;
        docentesConAcceso: number;
        estudiantesConAcceso: number;
      }>;
    };

    if (!fecha || !registros?.length) {
      return NextResponse.json({ error: "Faltan datos: fecha y registros requeridos" }, { status: 400 });
    }

    let insertados = 0;
    for (const reg of registros) {
      await db
        .insert(accesosDiarios)
        .values({
          centroEscolarCode: reg.code,
          fecha,
          docentesConAcceso: reg.docentesConAcceso,
          estudiantesConAcceso: reg.estudiantesConAcceso,
        })
        .onConflictDoUpdate({
          target: [accesosDiarios.centroEscolarCode, accesosDiarios.fecha],
          set: {
            docentesConAcceso: reg.docentesConAcceso,
            estudiantesConAcceso: reg.estudiantesConAcceso,
          },
        });
      insertados++;
    }

    return NextResponse.json({ ok: true, insertados, fecha });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al guardar accesos" }, { status: 500 });
  }
}

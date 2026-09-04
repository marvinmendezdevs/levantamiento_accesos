/**
 * Script de seed: lee el CSV del levantamiento e inserta:
 *   1. centros_escolares (denominador fijo)
 *   2. accesos_diarios para HOY con los valores actuales del CSV
 *
 * Uso: npm run db:seed
 * (requiere DATABASE_URL en .env.local)
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { centrosEscolares, accesosDiarios } from "../src/db/schema";

// Carga .env.local manualmente para tsx
import { config } from "process";
const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  });
} catch {}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL no definida en .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { centrosEscolares, accesosDiarios } });

// ---------- CSV parser ----------
function parseCSV(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const header = lines[0].split(",");
  console.log("Columnas detectadas:", header);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields with commas inside
    const cols: string[] = [];
    let current = "";
    let inQuote = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    cols.push(current.trim());

    if (cols.length < 7) continue;
    rows.push({
      grupo: cols[0],
      code: cols[1],
      nombre: cols[2],
      totalDocentes: parseInt(cols[3]) || 0,
      docentesConAcceso: parseInt(cols[4]) || 0,
      totalEstudiantes: parseInt(cols[5]) || 0,
      estudiantesConAcceso: Math.round(parseFloat(cols[6]) || 0),
    });
  }
  return rows;
}

async function main() {
  const csvPath = resolve(process.cwd(), "scripts", "data.csv");
  console.log(`📂 Leyendo CSV desde: ${csvPath}`);
  const rows = parseCSV(csvPath);
  console.log(`📊 Registros a procesar: ${rows.length}`);

  const today = new Date().toISOString().split("T")[0];

  // 1. Insertar centros_escolares (upsert por code)
  console.log("⬆️  Insertando centros_escolares...");
  for (const row of rows) {
    await db
      .insert(centrosEscolares)
      .values({
        code: row.code,
        nombre: row.nombre,
        grupo: row.grupo,
        totalDocentes: row.totalDocentes,
        totalEstudiantes: row.totalEstudiantes,
      })
      .onConflictDoUpdate({
        target: centrosEscolares.code,
        set: {
          nombre: row.nombre,
          grupo: row.grupo,
          totalDocentes: row.totalDocentes,
          totalEstudiantes: row.totalEstudiantes,
        },
      });
  }

  // 2. Insertar accesos de hoy (upsert por code+fecha)
  console.log(`📅 Insertando accesos para ${today}...`);
  for (const row of rows) {
    await db
      .insert(accesosDiarios)
      .values({
        centroEscolarCode: row.code,
        fecha: today,
        docentesConAcceso: row.docentesConAcceso,
        estudiantesConAcceso: row.estudiantesConAcceso,
      })
      .onConflictDoUpdate({
        target: [accesosDiarios.centroEscolarCode, accesosDiarios.fecha],
        set: {
          docentesConAcceso: row.docentesConAcceso,
          estudiantesConAcceso: row.estudiantesConAcceso,
        },
      });
  }

  console.log("✅ Seed completado exitosamente.");
  console.log(`   Centros escolares: ${rows.length}`);
  console.log(`   Fecha de accesos: ${today}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

import { pgTable, serial, varchar, text, integer, date, timestamp, unique, boolean } from "drizzle-orm/pg-core";

/**
 * Tabla base — denominador fijo, viene del CSV del levantamiento.
 * NO se modifica después del seed inicial (salvo `intervenido`, que se
 * actualiza manualmente en la BD y el seed nunca debe tocar).
 */
export const centrosEscolares = pgTable("centros_escolares", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  nombre: text("nombre").notNull(),
  grupo: varchar("grupo", { length: 10 }),
  totalDocentes: integer("total_docentes").notNull().default(0),
  totalEstudiantes: integer("total_estudiantes").notNull().default(0),
  intervenido: boolean("intervenido").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Tabla diaria — numerador que cambia cada día.
 * Un registro por (centro_escolar_code, fecha).
 * Se actualiza/inserta una vez al día con los accesos actuales.
 */
export const accesosDiarios = pgTable(
  "accesos_diarios",
  {
    id: serial("id").primaryKey(),
    centroEscolarCode: varchar("centro_escolar_code", { length: 10 })
      .notNull()
      .references(() => centrosEscolares.code, { onDelete: "cascade" }),
    fecha: date("fecha").notNull(),
    docentesConAcceso: integer("docentes_con_acceso").notNull().default(0),
    estudiantesConAcceso: integer("estudiantes_con_acceso").notNull().default(0),
    creadoAt: timestamp("creado_at").defaultNow(),
  },
  (t) => ({
    uniqCEFecha: unique("uq_ce_fecha").on(t.centroEscolarCode, t.fecha),
  })
);

export type CentroEscolar = typeof centrosEscolares.$inferSelect;
export type AccesoDiario = typeof accesosDiarios.$inferSelect;
export type CentroEscolarInsert = typeof centrosEscolares.$inferInsert;
export type AccesoDiarioInsert = typeof accesosDiarios.$inferInsert;

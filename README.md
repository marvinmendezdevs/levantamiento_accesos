# Tablero de Accesos — MINED

Dashboard de seguimiento del levantamiento de accesos de docentes y estudiantes por centro escolar.

## Stack
- **Next.js 14** (App Router)
- **Drizzle ORM**
- **PostgreSQL** (Neon)
- **Tailwind CSS**
- Deploy: **Vercel + Neon**

---

## Primeros pasos

### 1. Clonar e instalar

```bash
npm install
```

### 2. Configurar variables de entorno

Copiá el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

Editá `.env.local` y pegá la DATABASE_URL de tu proyecto en [Neon](https://console.neon.tech):

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 3. Crear las tablas en Neon

```bash
npm run db:push
```

Esto crea las dos tablas: `centros_escolares` y `accesos_diarios`.

### 4. Correr el seed

Primero copiá tu CSV dentro de `scripts/` con el nombre `data.csv`:

```bash
cp ruta/a/tu/archivo.csv scripts/data.csv
```

Luego corrés:

```bash
npm run db:seed
```

Esto:
1. Inserta todos los centros escolares (denominador fijo — no cambia)
2. Inserta los accesos de hoy con los valores del CSV

### 5. Correr en local

```bash
npm run dev
```

Abrís [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel + Neon

1. **Neon**: Creá un proyecto en [neon.tech](https://console.neon.tech), copiá la `DATABASE_URL`.

2. **Vercel**: Conectá tu repositorio en [vercel.com](https://vercel.com). Agregá la variable de entorno:
   - `DATABASE_URL` → tu connection string de Neon

3. **Migraciones en producción**: Después del primer deploy, desde local corrés:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## Actualización diaria de accesos

Cada día que tengas datos nuevos, corrés el seed nuevamente (reemplaza el CSV) o usás la API:

### Opción A — Re-seed con CSV actualizado
```bash
cp nuevo_archivo.csv scripts/data.csv
npm run db:seed
```

### Opción B — API REST
```bash
curl -X POST https://tu-app.vercel.app/api/accesos \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-09-05",
    "registros": [
      { "code": "10005", "docentesConAcceso": 3, "estudiantesConAcceso": 45 },
      { "code": "10013", "docentesConAcceso": 8, "estudiantesConAcceso": 320 }
    ]
  }'
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx          ← Dashboard principal
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── stats/        ← GET /api/stats
│       ├── schools/      ← GET /api/schools?page=1&search=...
│       └── accesos/      ← POST /api/accesos
├── components/
│   ├── KPICard.tsx       ← Tarjeta de métricas
│   └── SchoolsTable.tsx  ← Tabla paginada
└── db/
    ├── schema.ts         ← Tablas Drizzle
    └── index.ts          ← Conexión Neon
scripts/
└── seed.ts               ← Importa el CSV a la BD
```

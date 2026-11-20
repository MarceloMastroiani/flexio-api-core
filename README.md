# Flexio API Core

API para la gestión de una peluquería. Backend en **NestJS** con **Prisma** + **PostgreSQL**.

> **Stack:** NestJS 12 · TypeScript 6 · Prisma 7 · PostgreSQL · JWT (Passport) · Swagger · Vitest

---

## Requisitos

- Node.js ≥ 20.19 (recomendado 22 LTS o superior)
- pnpm 12 (`packageManager` ya fijado en `package.json`)
- Docker + Docker Compose (para la base de datos de desarrollo)

---

## Puesta en marcha

### 1. Variables de entorno

Copiá `.env.template` a `.env` y completá los valores:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de escucha (por defecto `8080`) |
| `CORS_ORIGIN` | Origen permitido por CORS (URL del frontend, ej. `http://localhost:5173`) |
| `DATABASE_URL` | Connection string de PostgreSQL |
| `JWT_SECRET` | Secreto para firmar/verificar los JWT |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Credenciales de Resend para emails |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales de la DB de prueba de Docker |

### 2. Levantar con Docker (recomendado)

```bash
docker compose up -d --build
```

El contenedor `api` ejecuta, en orden: `prisma generate` → `prisma migrate deploy` → build → `start:dev`.

### 3. Levantar sin Docker

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run start:dev
```

La API queda en `http://localhost:8080`, con prefijo global `/api` y Swagger en `/apiDoc`.

### Seed de datos

```bash
pnpm exec prisma db seed
# crea el admin: admin@pelu / 1234
```

---

## Scripts

| Script | Descripción |
|---|---|
| `pnpm run build` | Compila con `nest build` (tsc) |
| `pnpm run start:dev` | Arranca en modo watch |
| `pnpm run start:prod` | Ejecuta `dist/src/main` |
| `pnpm test` | Corre los tests con **Vitest** |
| `pnpm test:watch` | Vitest en modo watch |
| `pnpm test:cov` | Vitest con cobertura |
| `pnpm run lint` | ESLint + Prettier |

---

## Modelo de negocio (turnos)

- **El cliente reserva solo fecha/hora/profesional.** No elige el servicio.
- Cada empleado tiene una **duración por defecto de turno** (`slotMinutes`, en minutos; default 30).
- Al crear un turno, `endsAt = startsAt + duración`. Si no se envía duración, se usa el `slotMinutes` del empleado.
- El **servicio se asigna después** (por el staff, al atender), solo con fines informativos y de métricas.
- El staff puede **extender** un turno (recalcular `endsAt`) ocupando bloques libres; si el bloque está ocupado, la API responde `409`.

---

## Endpoints

Todas las rutas llevan el prefijo `/api`.

### Auth (`/api/auth`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login (email + password) → `{ access_token }` | público |
| GET | `/auth/profile` | Perfil del usuario logueado | JWT |
| POST | `/auth` | Crear usuario (ADMIN/STAFF) | ADMIN |
| GET | `/auth` | Listar usuarios | ADMIN |
| GET | `/auth/:id` | Obtener un usuario | ADMIN |

### Público (`/api/public`) — sin login
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/public/employees` | Lista de profesionales (`id`, `name`) para reservar |
| POST | `/public/appointments` | Reserva un turno: `{ name, phone, email?, employeeId, startsAt, durationMinutes?, notes? }`. Crea/encuentra el cliente por teléfono. |

### Turnos (`/api/appointments`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/appointments/available?employeeId&date` | Slots libres según el `slotMinutes` del empleado |
| POST | `/appointments` | Crea turno: `{ customerId, employeeId, startsAt, durationMinutes?, notes? }` |
| GET | `/appointments` | Lista todos los turnos |
| GET | `/appointments/today` | Turnos de hoy |
| PATCH | `/appointments/:id` | Actualiza `status`, `serviceId` (asignar/quitar servicio) o `durationMinutes` (extender) |
| DELETE | `/appointments/:id` | Elimina un turno |

### Servicios (`/api/services`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/services` | Lista servicios (catálogo, público) |
| POST | `/services` | Crea servicio `{ name, price }` |
| PATCH | `/services/:id` | Actualiza servicio |
| DELETE | `/services/:id` | Elimina servicio |

### Clientes (`/api/customers`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/customers` | Crea cliente `{ name, phone?, email? }` (al menos un contacto) |
| GET | `/customers` | Lista clientes |
| GET | `/customers/:id` | Obtiene un cliente |
| PATCH | `/customers/:id` | Actualiza cliente |
| DELETE | `/customers/:id` | Elimina cliente |

### Empleados (`/api/employees`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/employees/:userId` | Crea empleado vinculado a un usuario: `{ name, email?, slotMinutes?, availability }` |
| GET | `/employees` | Lista empleados |
| PATCH | `/employees/:id` | Actualiza nombre/email/slotMinutes/disponibilidad |
| DELETE | `/employees/:id` | Elimina empleado |

### Caja (`/api/cash`) — ADMIN
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/cash/:appointmentId` | Registra un pago `{ amount, method, notes? }` |
| GET | `/cash/payments/day?date=` | Pagos del día |
| GET | `/cash/payments/cash-close?date=` | Cierre de caja |
| GET | `/cash` | Todos los pagos |
| GET | `/cash/:id` | Un pago |
| GET | `/cash/appointment/:appointmentId` | Pagos de un turno |
| PATCH | `/cash/:id` | Actualiza pago |
| DELETE | `/cash/:id` | Elimina pago |

### Reportes (`/api/reports`)

Todos requieren JWT con rol **`ADMIN`** (`@Roles('ADMIN')`). Respuesta unificada `{ meta, data }`; `meta` incluye `from`, `to`, `timezone`, `generatedAt`, y opcionalmente `granularity` y `comparison`.

**Parámetros de rango** (salvo `customers/inactive`):
- `from`, `to`: fecha local `YYYY-MM-DD`, **ambas inclusivas**. Defaults: últimos 30 días hasta hoy.
- Validaciones: fecha real (rechaza `2026-02-31`), `from <= to`, rango máximo **366 días**, `to >= 2020-01-01`. Inválido → `400`.

| Método | Ruta | Parámetros | Descripción |
|---|---|---|---|
| GET | `/reports/revenue` | `from,to,granularity,format` | Ingresos por `paidAt` |
| GET | `/reports/appointments` | `from,to,granularity,format` | Turnos por `startsAt` |
| GET | `/reports/appointments/heatmap` | `from,to` | Turnos no cancelados por día de semana y hora local |
| GET | `/reports/services/top` | `from,to,limit,orderBy` | Top servicios (turnos `COMPLETED`) |
| GET | `/reports/employees` | `from,to` | Métricas y ocupación por empleado |
| GET | `/reports/customers` | `from,to,limit` | Activos/nuevos/recurrentes + top por gasto/visitas |
| GET | `/reports/customers/inactive` | `days,page,pageSize` | Clientes inactivos (paginado) |
| GET | `/reports/summary` | `from,to,compare` | Dashboard que compone el resto |

`granularity`: `day` (default) · `week` (semanas desde el lunes) · `month`. `format`: `json` (default) · `csv`.

**Definiciones exactas**
- **Ingresos**: `Payment.paidAt` (fecha de cobro) dentro del rango; moneda del negocio (ARS), `number` con 2 decimales (sumado en SQL con `ROUND(COALESCE(SUM(...),0),2)::float8`).
- **Turnos**: `Appointment.startsAt` dentro del rango.
- **Cliente activo**: al menos un turno `COMPLETED` en el rango.
- **Cliente nuevo**: su primer `COMPLETED` de toda la historia cae dentro del rango.
- **Cliente recurrente**: activo y con al menos un `COMPLETED` anterior al rango.
- **Ocupación**: minutos reservados (turnos `PENDING`/`CONFIRMED`/`COMPLETED`, `endsAt - startsAt` recortado al rango) / minutos disponibles (disponibilidad semanal del empleado × días del rango). `null` si no tiene horario.
- **`extendedCount`**: turnos con `extendedSlots > 0`.
- **`coveragePct`** (servicios): turnos `COMPLETED` con servicio asignado / total `COMPLETED`.
- **`sharePct`** (servicios): participación del servicio sobre los turnos `COMPLETED` con servicio.

**Zona horaria y rangos**
Las fechas se interpretan en `BUSINESS_TIMEZONE` (default `America/Argentina/Buenos_Aires`) y se convierten a un intervalo UTC semiabierto `[fromUtc, toUtcExclusive)`. Las columnas son `timestamp(3)` en UTC; para agrupar por día/semana/mes local se usa `("col" AT TIME ZONE 'UTC') AT TIME ZONE :tz` + `date_trunc`.

**CSV** (`revenue` y `appointments` con `format=csv`)
`Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`, BOM UTF-8, fin de línea `\r\n`, escape de comas/comillas/saltos y protección anti *CSV injection* (prefijo `'` en textos que empiezan con `= + - @`). Columnas: revenue `date,total,count`; appointments `date,total,completed,cancelled`.

**Caché**
En memoria vía `@nestjs/cache-manager`, aislada detrás de `ReportsCacheService`. Solo se cachean rangos **totalmente pasados** (TTL 300 s); los rangos que incluyen hoy **no** se cachean. La key incluye reporte + parámetros normalizados (orden fijo) + `timezone`. Para pasar a Redis se cambia solo el store registrado en `ReportsModule`.

**Variante de esquema (servicios)**
El repo usa la variante **(b)**: un único `Appointment.serviceId` + `Appointment.priceAtTime`. Toda la relación turno–servicio está aislada en `repositories/services-report.repository.ts`; migrar a la variante (a) (`AppointmentService` many-to-many con `priceAtTime`) solo requiere cambiar ese archivo, manteniendo el contrato.

**Datos demo**
```bash
pnpm run seed:demo   # determinístico; se niega si ya hay >50 turnos (usar --force)
```

**Cómo agregar un reporte nuevo**
1. `repositories/<x>.repository.ts`: queries (`Prisma` o `$queryRaw` parametrizado; `COUNT(*)::int`; dinero `::float8`).
2. `services/<x>.service.ts`: `resolveRange()` + `runReport()` (cache/logging) + armar `{ meta, data }`.
3. DTO de query extendiendo `ReportRangeDto`, con `@ApiPropertyOptional`.
4. Ruta en `reports.controller.ts` con `@ApiOkResponse({ type: XResponseDto })`.
5. Clase de respuesta con `@ApiProperty` en `types/report-response.type.ts`.
6. Tests en `src/reports/**/*.spec.ts` y `pnpm test`.

---

## Testing

Tests con **Vitest** (unitarios + controllers con mocks, sin dependencia de base de datos):

```bash
pnpm test        # corre toda la suite
pnpm test:cov    # con cobertura (v8)
```

- `src/**/*.spec.ts` → tests unitarios de servicios, helpers y controllers.
- `test/setup.ts` → carga `.env` y provee valores por defecto para que la validación de `envs.ts` no falle.
- `vitest.config.mts` → usa `unplugin-swc` para soportar decoradores + `emitDecoratorMetadata` (requisito de NestJS) y configura los alias `@/` y `generated/`.

---

## Verificación de performance

Índices agregados para los reportes (migración `20261119120000_reports_indexes`):

- `Payment(paidAt)`
- `Appointment(startsAt)`
- `Appointment(status, startsAt)`
- `Appointment(employeeId, startsAt)`
- `Appointment(customerId)`
- `Appointment(serviceId)`

Para verificar que el planner los usa (con volúmenes reales; en tablas chicas puede preferir *seq scan*, por eso se fuerza con `enable_seqscan = off`):

```sql
SET enable_seqscan = off;

-- Revenue por rango de pago → usa Payment_paidAt_idx
EXPLAIN SELECT ROUND(COALESCE(SUM("amount"),0),2)::float8
FROM "Payment"
WHERE "paidAt" >= '2026-01-01' AND "paidAt" < '2027-01-01';

-- Turnos por estado + fecha → usa Appointment_status_startsAt_idx (Index Only Scan)
EXPLAIN SELECT count(*)::int
FROM "Appointment"
WHERE "status" = 'COMPLETED'
  AND "startsAt" >= '2026-01-01' AND "startsAt" < '2027-01-01';

-- Turnos por empleado + fecha → usa Appointment_employeeId_startsAt_idx
EXPLAIN SELECT count(*)::int
FROM "Appointment"
WHERE "employeeId" = '<uuid>'
  AND "startsAt" >= '2026-01-01' AND "startsAt" < '2027-01-01';
```

Verificado localmente con Docker sobre el dataset demo (~3000 turnos / ~2200 pagos): el planner usa `Payment_paidAt_idx` (Index Scan), `Appointment_status_startsAt_idx` y `Appointment_employeeId_startsAt_idx` (Index Only Scan) sin forzar `enable_seqscan`. La constraint `no_overlapping_appointments` y la extensión `btree_gist` quedan intactas.

---

## Frontend

El frontend vive en `../flexio-web` (React + Vite + TypeScript + Tailwind). Corre en `http://localhost:5173` y consume esta API.

---

## Notas y pendientes conocidos

- El módulo de reportes está implementado (ver sección **Reportes**); `GET /reports/appointments?month=` y otros del TODO original quedan fuera de alcance.
- `@nestjs/throttler` no está instalado: el rate limit (30 req/min en `/reports/*`) queda como pendiente.
- Cron de recordatorios por email desactivado (decorador `@Cron` comentado).
- Varios endpoints de escritura (PATCH/DELETE de `services` y `employees`, y todo `appointments`) todavía **no tienen guards**; quedan como deuda de seguridad pendiente.
- Lint y TypeScript estricto están limpios (`pnpm lint` y `tsc` sin errores). El proyecto usa `module`/`moduleResolution: NodeNext` y `strict` con `exactOptionalPropertyTypes`.
- Los imports de Prisma usan rutas relativas a `generated/prisma` (no hay alias `@/`).

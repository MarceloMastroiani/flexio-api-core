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
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/reports/revenue?from&to` | Ingresos del período (⚠️ pendiente de implementar) |

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

Verificado localmente con Docker: `Payment_paidAt_idx` (Index Scan) y `Appointment_status_startsAt_idx` (Index Only Scan). La constraint `no_overlapping_appointments` y la extensión `btree_gist` quedan intactas.

---

## Frontend

El frontend vive en `../flexio-web` (React + Vite + TypeScript + Tailwind). Corre en `http://localhost:5173` y consume esta API.

---

## Notas y pendientes conocidos

- El endpoint `GET /reports/revenue` sigue siendo un stub hasta reemplazar el módulo de reportes.
- El cron de recordatorios por email está desactivado (decorador `@Cron` comentado).
- Varios endpoints de escritura (PATCH/DELETE de `services` y `employees`, y todo `appointments`) todavía **no tienen guards**; quedan como deuda de seguridad pendiente.
- Lint y TypeScript estricto están limpios (`pnpm lint` y `tsc` sin errores). El proyecto usa `module`/`moduleResolution: NodeNext` y `strict` con `exactOptionalPropertyTypes`.
- Los imports de Prisma usan rutas relativas a `generated/prisma` (no hay alias `@/`).

-- 1. Employee: duración por defecto del turno (en minutos)
ALTER TABLE "Employee" ADD COLUMN "slotMinutes" INTEGER NOT NULL DEFAULT 30;

-- 2. Customer: teléfono y email pasan a ser opcionales
--    (la app valida que exista al menos uno de los dos)
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;

-- 3. Service: se elimina la duración (el servicio pasa a ser solo informativo)
ALTER TABLE "Service" DROP COLUMN "duration";

-- 4. Appointment: vuelve a una relación 1:1 opcional con Service
ALTER TABLE "Appointment" ADD COLUMN "serviceId" TEXT;

-- 5. Backfill: asigna el primer servicio de cada turno existente
--    (si un turno tenía varios servicios, se conserva solo el primero)
UPDATE "Appointment" a
SET "serviceId" = sub."serviceId"
FROM (
  SELECT DISTINCT ON ("appointmentId") "appointmentId", "serviceId"
  FROM "AppointmentService"
  ORDER BY "appointmentId", "serviceId"
) sub
WHERE a."id" = sub."appointmentId";

-- 6. FK del servicio: al eliminar un servicio, el turno queda sin servicio
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Se elimina la tabla intermedia many-to-many
DROP TABLE "AppointmentService";

-- Índices para reportes + snapshot de precio y bloques extendidos.
-- NOTA: no toca la constraint no_overlapping_appointments ni la extensión btree_gist.

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "extendedSlots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "priceAtTime" DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "Appointment_startsAt_idx" ON "Appointment"("startsAt");

-- CreateIndex
CREATE INDEX "Appointment_status_startsAt_idx" ON "Appointment"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_employeeId_startsAt_idx" ON "Appointment"("employeeId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

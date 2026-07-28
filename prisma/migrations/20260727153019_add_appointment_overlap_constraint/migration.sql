-- Habilitar extensión necesaria (permite usar = e igualdad en exclusion constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Constraint: un mismo empleado no puede tener dos turnos que se solapen
-- (ignorando los turnos cancelados)
ALTER TABLE "Appointment"
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  "employeeId" WITH =,
  tsrange("startsAt", "endsAt") WITH &&
)
WHERE (status IN ('PENDING', 'CONFIRMED'));

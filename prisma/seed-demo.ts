/* eslint-disable no-console */
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { DateTime } from 'luxon';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import { getSlotMinutes } from '../src/reports/helpers/slot-duration.helper';

const TZ = process.env.BUSINESS_TIMEZONE ?? 'America/Argentina/Buenos_Aires';
const SEED = 20261119;

// ── PRNG determinístico ──────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const chance = (p: number) => rnd() < p;
const randInt = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
type DayRange = { start: string; end: string };
type Availability = Record<string, DayRange[]>;

const EMPLOYEES: { name: string; email: string; slot: number; availability: Availability }[] = [
  {
    name: 'Nito',
    email: 'nito.demo@flexio.com',
    slot: 30,
    availability: {
      mon: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
      tue: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
      wed: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
      thu: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
      fri: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
    },
  },
  {
    name: 'Marcelo',
    email: 'marcelo.demo@flexio.com',
    slot: 45,
    availability: {
      tue: [{ start: '10:00', end: '19:00' }],
      wed: [{ start: '10:00', end: '19:00' }],
      thu: [{ start: '10:00', end: '19:00' }],
      fri: [{ start: '10:00', end: '19:00' }],
      sat: [{ start: '10:00', end: '14:00' }],
    },
  },
  {
    name: 'Julian',
    email: 'julian.demo@flexio.com',
    slot: 60,
    availability: {
      mon: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
      wed: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
      fri: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    },
  },
];

const SERVICE_NAMES = [
  'Corte de pelo', 'Corte + barba', 'Barba', 'Tinte completo', 'Reflejos',
  'Keratina', 'Alisado', 'Peinado', 'Lavado y secado', 'Corte niño',
  'Color raíz', 'Mechas', 'Tratamiento capilar', 'Depilación', 'Brushing',
];

const FIRST_NAMES = ['Leo', 'Naza', 'Marce', 'Sofi', 'Lucas', 'Valen', 'Tomi', 'Caro', 'Juli', 'Nacho', 'Mica', 'Fede', 'Rocío', 'Bruno', 'Agus'];
const LAST_NAMES = ['Gómez', 'Pérez', 'Messi', 'Gutiérrez', 'López', 'Fernández', 'Romero', 'Sosa', 'Díaz', 'Torres', 'Ruiz', 'Silva'];

const METHODS = ['CASH', 'TRANSFER', 'CARD', 'MERCADOPAGO'] as const;
const STATUSES_FUTURE = ['CONFIRMED', 'PENDING'] as const;

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed-demo cannot run in production');
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.appointment.count();
    const force = process.argv.includes('--force');
    if (existing > 50 && !force) {
      throw new Error(
        `Refusing to seed: there are already ${existing} appointments (use --force to override)`,
      );
    }

    console.log(`Seeding demo data (tz=${TZ}, existing appointments=${existing})…`);

    const now = DateTime.now().setZone(TZ);
    const startDay = now.minus({ days: 350 }).startOf('day');
    const endDay = now.plus({ days: 15 }).startOf('day');

    // ── Servicios ──
    const servicesData: Prisma.ServiceCreateManyInput[] = SERVICE_NAMES.map(
      (name, i) => ({
        id: randomUUID(),
        name,
        price: new Prisma.Decimal(2000 + i * 750),
      }),
    );
    await prisma.service.createMany({ data: servicesData });
    const services = await prisma.service.findMany();

    // ── Empleados ──
    const employeesData: Prisma.EmployeeCreateManyInput[] = EMPLOYEES.map((e) => ({
      id: randomUUID(),
      name: e.name,
      email: e.email,
      slotMinutes: e.slot || getSlotMinutes(),
      availability: e.availability as unknown as Prisma.InputJsonValue,
    }));
    await prisma.employee.createMany({ data: employeesData });
    const employees = await prisma.employee.findMany();

    // ── Clientes ──
    const customersData: Prisma.CustomerCreateManyInput[] = Array.from(
      { length: 200 },
      (_, i) => {
        const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
        return {
          id: randomUUID(),
          name,
          phone: `+54911${String(1_000_000 + i).slice(-7)}`,
          email: `cliente${i}@demo.flexio.com`,
          firstVisitAt: startDay.plus({ days: randInt(0, 300) }).toUTC().toJSDate(),
        };
      },
    );
    await prisma.customer.createMany({ data: customersData });
    const customers = await prisma.customer.findMany({ select: { id: true } });

    // ── Candidatos de slots (sin solapar por empleado) ──
    interface Slot {
      employeeId: string;
      dayISO: string;
      startMin: number;
      endMin: number;
      slot: number;
    }
    const candidates: Slot[] = [];
    for (const emp of employees) {
      const availability = (emp.availability ?? {}) as Availability;
      for (let d = startDay; d <= endDay; d = d.plus({ days: 1 })) {
        const key = DAY_KEYS[d.weekday - 1]!;
        const ranges = availability[key] ?? [];
        for (const range of ranges) {
          const rStart = hhmmToMinutes(range.start);
          const rEnd = hhmmToMinutes(range.end);
          for (let t = rStart; t + emp.slotMinutes <= rEnd; t += emp.slotMinutes) {
            candidates.push({
              employeeId: emp.id,
              dayISO: d.toISODate()!,
              startMin: t,
              endMin: rEnd,
              slot: emp.slotMinutes,
            });
          }
        }
      }
    }

    // Shuffle determinístico
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
    }

    const TARGET = 3000;
    const occupied = new Set<string>();
    const keyOf = (empId: string, dayISO: string, min: number) =>
      `${empId}|${dayISO}|${min}`;

    const appointmentsData: Prisma.AppointmentCreateManyInput[] = [];
    const paymentsData: Prisma.PaymentCreateManyInput[] = [];

    for (const c of candidates) {
      if (appointmentsData.length >= TARGET) break;
      if (occupied.has(keyOf(c.employeeId, c.dayISO, c.startMin))) continue;

      const localStart = DateTime.fromISO(c.dayISO, { zone: TZ }).plus({
        minutes: c.startMin,
      });
      const startsAt = localStart.toUTC().toJSDate();

      const extend = chance(0.08) ? randInt(1, 2) : 0;
      const blocks = 1 + extend;
      if (c.startMin + c.slot * blocks > c.endMin) continue;

      // Marca ocupados los bloques
      for (let b = 0; b < blocks; b++) {
        occupied.add(keyOf(c.employeeId, c.dayISO, c.startMin + c.slot * b));
      }

      const isPast = localStart < now.minus({ hours: 12 });
      let status: 'COMPLETED' | 'CANCELLED' | 'CONFIRMED' | 'PENDING';
      if (isPast) {
        status = chance(0.9) ? 'COMPLETED' : 'CANCELLED';
      } else {
        status = chance(0.1) ? 'CANCELLED' : pick(STATUSES_FUTURE);
      }

      const service = chance(status === 'COMPLETED' ? 0.85 : 0.2) ? pick(services) : null;
      const customer = pick(customers);
      const endsAt = new Date(
        startsAt.getTime() + c.slot * blocks * 60_000,
      );

      const id = randomUUID();
      appointmentsData.push({
        id,
        startsAt,
        endsAt,
        status,
        customerId: customer.id,
        employeeId: c.employeeId,
        serviceId: service?.id ?? null,
        priceAtTime: service ? service.price : null,
        extendedSlots: extend > 0 ? blocks - 1 : 0,
        notes: null,
      });

      if (status === 'COMPLETED' && chance(0.85)) {
        const amount = service
          ? service.price
          : new Prisma.Decimal(randInt(2, 20) * 1000);
        paymentsData.push({
          id: randomUUID(),
          appointmentId: id,
          amount,
          method: pick(METHODS),
          paidAt: new Date(startsAt.getTime() + randInt(0, 90) * 60_000),
          notes: null,
        });
      }
    }

    // Inserción por lotes
    const CHUNK = 500;
    for (let i = 0; i < appointmentsData.length; i += CHUNK) {
      await prisma.appointment.createMany({
        data: appointmentsData.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
    }
    for (let i = 0; i < paymentsData.length; i += CHUNK) {
      await prisma.payment.createMany({
        data: paymentsData.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
    }

    const totalAppointments = await prisma.appointment.count();
    const totalPayments = await prisma.payment.count();
    console.log(
      `Done. employees=${employees.length} services=${services.length} customers=${customers.length} appointments=${appointmentsData.length} payments=${paymentsData.length}`,
    );
    console.log(`Totals in DB: appointments=${totalAppointments} payments=${totalPayments}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

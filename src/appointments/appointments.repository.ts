import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateAppointmentParams } from './dto/create-appointment.dto';

// Include estándar para los turnos: servicio asignado + cliente + empleado
const appointmentInclude = {
  service: true,
  customer: true,
  employee: true,
} satisfies Prisma.AppointmentInclude;

// Tipo del turno con sus relaciones incluidas
export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeWithAvailability(employeeId: string) {
    return this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
  }

  async getBusyAppointments(employeeId: string, dayStart: Date, dayEnd: Date) {
    return this.prisma.appointment.findMany({
      where: {
        employeeId,
        status: { in: ['PENDING', 'CONFIRMED'] }, // CANCELLED no bloquea
        startsAt: { gte: dayStart, lte: dayEnd },
      },
      select: { startsAt: true, endsAt: true },
    });
  }

  async checkAvailability(
    employeeId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<boolean> {
    const conflicts = await this.prisma.$queryRaw<{ id: string }[]>`
       SELECT id FROM "Appointment"
       WHERE "employeeId" = ${employeeId}
         AND status IN ('PENDING', 'CONFIRMED')
         AND tsrange("startsAt", "endsAt") && tsrange(${startsAt}::timestamp, ${endsAt}::timestamp)
       LIMIT 1
     `;

    return conflicts.length === 0;
  }

  async createAppointment(
    params: CreateAppointmentParams,
  ): Promise<AppointmentWithRelations> {
    const { employeeId, customerId, startsAt, endsAt, notes } = params;

    return this.prisma.appointment.create({
      data: {
        employeeId,
        customerId,
        startsAt,
        endsAt,
        notes: notes ?? null,
      },
      include: appointmentInclude,
    });
  }

  async findAllAppointments(): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      include: appointmentInclude,
    });
  }

  async findById(id: string): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
  }

  async findToday(): Promise<AppointmentWithRelations[]> {
    const now = new Date();
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );

    return this.prisma.appointment.findMany({
      where: {
        startsAt: { gte: start, lt: end },
      },
      include: appointmentInclude,
    });
  }

  // Próximos turnos activos de un cliente (por teléfono), para el portal público.
  async findUpcomingByPhone(
    phone: string,
    from: Date,
  ): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: {
        customer: { phone },
        status: { in: ['PENDING', 'CONFIRMED'] },
        startsAt: { gte: from },
      },
      include: appointmentInclude,
      orderBy: { startsAt: 'asc' },
    });
  }

  // Busca un turno por id verificando que pertenezca al teléfono indicado.
  async findByIdAndPhone(
    id: string,
    phone: string,
  ): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.findFirst({
      where: { id, customer: { phone } },
      include: appointmentInclude,
    });
  }

  async updateAppointment(
    id: string,
    data: Prisma.AppointmentUpdateInput,
  ): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: appointmentInclude,
    });
  }

  // Actualiza el turno y, en la misma transacción, marca la última visita del
  // cliente (solo si este startsAt es más reciente que el valor actual).
  async updateAppointmentWithLastVisit(
    id: string,
    data: Prisma.AppointmentUpdateInput,
    visitAt: Date,
  ): Promise<AppointmentWithRelations | null> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data,
        include: appointmentInclude,
      });

      await tx.customer.updateMany({
        where: {
          id: updated.customerId,
          OR: [{ lastVisitAt: null }, { lastVisitAt: { lt: visitAt } }],
        },
        data: { lastVisitAt: visitAt },
      });

      return updated;
    });
  }

  async removeAppointment(
    id: string,
  ): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.delete({
      where: { id },
      include: appointmentInclude,
    });
  }
}

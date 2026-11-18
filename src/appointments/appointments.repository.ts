import { Injectable, UseGuards } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Appointment, Prisma, Role } from '../../generated/prisma/client';
import { CreateAppointmentParams } from './dto/create-appointment.dto';

// Include estándar para los turnos: servicio asignado + cliente + empleado
const appointmentInclude = {
  service: true,
  customer: true,
  employee: true,
} satisfies Prisma.AppointmentInclude;

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
  ): Promise<Appointment> {
    const { employeeId, customerId, startsAt, endsAt, notes } = params;

    return this.prisma.appointment.create({
      data: {
        employeeId,
        customerId,
        startsAt,
        endsAt,
        notes,
      },
      include: appointmentInclude,
    });
  }

  async findAllAppointments(): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      include: appointmentInclude,
    });
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
  }

  async findToday(): Promise<Appointment[]> {
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

  async updateAppointment(
    id: string,
    data: Prisma.AppointmentUpdateInput,
  ): Promise<Appointment | null> {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: appointmentInclude,
    });
  }

  async removeAppointment(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.delete({
      where: { id },
      include: appointmentInclude,
    });
  }
}

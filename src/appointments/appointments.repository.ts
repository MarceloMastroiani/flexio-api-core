
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Appointment, Prisma } from '@/generated/prisma/client';
import { CreateAppointmentParams } from './dto/create-appointment.dto';
import { AppointmentStatus } from '@/generated/prisma/enums';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';



// Constante reutilizable
const appointmentInclude = {
  services: { include: { service: true } },
  customer: true,
  employee: true,
} satisfies Prisma.AppointmentInclude;
/*
* Le confirma a TypeScript que ese objeto
* cumple la forma que Prisma
* espera para incluir relaciones de "Appointment"
*/


@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {
  }

// ==============================================

  async getEmployeeWithAvailability(employeeId: string) {
    return this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
  }

  async getServiceDuration(serviceId: string) {
    return this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
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

// ==============================================

  async checkAvailability(employeeId: string, startsAt: Date, endsAt: Date): Promise<boolean> {

    const conflicts = await this.prisma.$queryRaw<{ id: string }[]>`
       SELECT id FROM "Appointment"
       WHERE "employeeId" = ${employeeId}
         AND status IN ('PENDING', 'CONFIRMED')
         AND tsrange("startsAt", "endsAt") && tsrange(${startsAt}::timestamp, ${endsAt}::timestamp)
       LIMIT 1
     `;

     return conflicts.length === 0;
  }

  async createAppointment(params: CreateAppointmentParams): Promise<Appointment> {

    const { employeeId, customerId, serviceIds, startsAt, endsAt, notes } = params;

    return await this.prisma.appointment.create({
      data: {
        employeeId,
        customerId,
        startsAt,
        endsAt,
        notes,
        services: {
          create: serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: appointmentInclude,
    });
  }

  async findAvailableAppointments() {
    return await this.prisma.appointment.findMany({
      where: {

      },
      include: appointmentInclude,
    });
  }

  async findAllAppointments() {
    return await this.prisma.appointment.findMany({
      include: appointmentInclude,
    });
  }

  async findToday() {

    const today = new Date()
    today.setDate(today.getDate() - 1);

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);


    return await this.prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: start.toISOString(),
          lt: end.toISOString(),
        },
      },
      include: appointmentInclude,
    });
  }

  async updateStatusAppointment(id: string, data: UpdateAppointmentDto): Promise<Appointment | null> {
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: data,
      include: appointmentInclude,
    });
    return updatedAppointment;
  }

  async removeAppointment(id: string): Promise<Appointment | null> {
    const deletedAppointment = await this.prisma.appointment.delete({
      where: { id },
      include: appointmentInclude,
    });
    return deletedAppointment;
  }
}

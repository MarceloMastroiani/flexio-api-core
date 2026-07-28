
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Appointment, Prisma } from '@/generated/prisma/client';
import { CreateAppointmentParams } from './dto/create-appointment.dto';

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

  async findAllAppointments() {
    return await this.prisma.appointment.findMany({
      include: appointmentInclude,
    });
  }

}

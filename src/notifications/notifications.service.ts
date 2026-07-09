import { Injectable } from '@nestjs/common';
import { ResendService } from './resend.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resend: ResendService
  ) { }

  // Envia una confirmación de cita al cliente
  async sendConfirmation(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,   // para el nombre y email del cliente
        employee: true,   // para el nombre del profesional
        service: true,    // para el nombre del servicio
      },
    });

    if (!appointment || !appointment.customer.email) {
      throw new Error('Appointment not found');
    }

    await this.resend.sendAppointmentConfirmation(
      appointment.customer.email,
      {
        customerName: appointment.customer.name,
        serviceName: appointment.service.name,
        employeeName: appointment.employee.name,
        date: appointment.startsAt.toLocaleDateString('es-AR'),
        time: appointment.startsAt.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    )
  }

  // Envia un recordatorio de cita al cliente
  async sendReminder(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        employee: true,
        service: true,
      },
    });

    if (!appointment || !appointment.customer.email) {
      throw new Error('Appointment not found');
    }

    await this.resend.sendAppointmentReminder(
      appointment.customer.email,
      {
        customerName: appointment.customer.name,
        serviceName: appointment.service.name,
        employeeName: appointment.employee.name,
        date: appointment.startsAt.toLocaleDateString('es-AR'),
        time: appointment.startsAt.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    )
  }
}

// Leer documentación de nest sobre:
// CRON - https://docs.nestjs.com/techniques/task-scheduling#declarative-cron-jobs
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCron {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
  }
  private readonly logger = new Logger(NotificationsCron.name);

  // CRON - Se ejecuta cada hora para enviar recordatorios de turnos dentro de las 24 horas
  // @Cron(CronExpression.EVERY_10_SECONDS) // Ejecuta cada hora: "0 0-23/1 * * *" EVERY_HOUR
  async handleCron() {
    this.logger.log('Cron job executed');

    const now = new Date();

    const startOfTomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    )); // Fecha de mañana a las 00:00:00
    const endOfTomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      23, 59, 59, 999
    )); // Fecha de mañana a las 23:59:59

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSentAt: null,
        startsAt: {
          gte: startOfTomorrow, // startsAt >= startOfTomorrow
          lte: endOfTomorrow, // startsAt <= endOfTomorrow
        },
      },
      include: {
        customer: true,
        employee: true,
        service: true,
      },
    });

    for (const appointment of appointments) {
      try {
        await this.notificationsService.sendReminder(appointment.id);
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSentAt: new Date() },
        });
      } catch (error) {
        this.logger.error(
          `Error enviando recordatorio para turno ${appointment.id}: ${error.message}`
        );
        // No actualiza reminderSentAt → el próximo ciclo lo reintenta
      }
    }
    }

  }

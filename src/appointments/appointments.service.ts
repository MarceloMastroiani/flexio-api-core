import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  AppointmentsRepository,
  AppointmentWithRelations,
} from './appointments.repository';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { ServicesService } from '../services/services.service';
import { Prisma } from '../../generated/prisma/client';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { calculateAvailableSlots } from './helpers/availability.helper';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly employeesService: EmployeesService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
  ) {}

  // Obtiene los horarios disponibles de un empleado en una fecha.
  // La duración de cada slot es el `slotMinutes` configurado para el empleado.
  async getAvailableSlots(dto: GetAvailableSlotsDto) {
    const { employeeId, date } = dto;

    const employee =
      await this.appointmentsRepository.getEmployeeWithAvailability(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const slotMinutes = employee.slotMinutes;

    const targetDate = new Date(date);
    const dayStart = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const dayEnd = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const busyAppointments =
      await this.appointmentsRepository.getBusyAppointments(
        employeeId,
        dayStart,
        dayEnd,
      );

    const busyRanges = busyAppointments.map((a) => ({
      start: a.startsAt,
      end: a.endsAt,
    }));

    return calculateAvailableSlots(
      dayStart,
      employee.availability as Record<string, { start: string; end: string }[]>,
      slotMinutes,
      busyRanges,
    );
  }

  // Crea un nuevo turno (sin servicio; el servicio se asigna después)
  async createAppointment(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentWithRelations> {
    const employee = await this.employeesService.findOneEmployee(
      createAppointmentDto.employeeId,
    );
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const customer = await this.customersService.findOneCustomer(
      createAppointmentDto.customerId,
    );
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const durationMinutes =
      createAppointmentDto.durationMinutes ?? employee.slotMinutes;

    const startsAt = new Date(createAppointmentDto.startsAt);
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    const isAvailable = await this.appointmentsRepository.checkAvailability(
      createAppointmentDto.employeeId,
      startsAt,
      endsAt,
    );

    if (!isAvailable) {
      throw new ConflictException(
        'That time slot is already occupied for this employee',
      );
    }

    try {
      return await this.appointmentsRepository.createAppointment({
        employeeId: createAppointmentDto.employeeId,
        customerId: createAppointmentDto.customerId,
        startsAt,
        endsAt,
        notes: createAppointmentDto.notes ?? undefined,
      });
    } catch (error) {
      if (this.isOverlapError(error)) {
        throw new ConflictException(
          'Ese horario ya está ocupado para este empleado',
        );
      }
      throw error;
    }
  }

  // Obtiene todos los turnos
  async findAllAppointments() {
    const appointments =
      await this.appointmentsRepository.findAllAppointments();

    if (!appointments) {
      throw new HttpException('No appointments found', HttpStatus.NOT_FOUND);
    }

    return appointments;
  }

  // Obtiene todos los turnos de hoy
  async findToday() {
    const appointmentsToday = await this.appointmentsRepository.findToday();

    if (!appointmentsToday) {
      throw new HttpException('No appointments found', HttpStatus.NOT_FOUND);
    }

    return appointmentsToday;
  }

  // Actualiza un turno: estado, servicio asignado, duración (extender) y notas
  async updateAppointment(id: string, dto: UpdateAppointmentDto) {
    const existing = await this.appointmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    // Si se asigna un servicio, validar que exista y capturar su precio actual
    const assignedService = dto.serviceId
      ? await this.servicesService.findOneService(dto.serviceId)
      : null;

    const data: Prisma.AppointmentUpdateInput = {};

    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.serviceId !== undefined) {
      // Asigna o desasigna el servicio mediante la relación
      data.service = dto.serviceId
        ? { connect: { id: dto.serviceId } }
        : { disconnect: true };
      // Snapshot del precio del servicio al momento de asignarlo (métricas)
      data.priceAtTime = assignedService ? assignedService.price : null;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }
    if (dto.durationMinutes !== undefined) {
      const newEndsAt = new Date(
        existing.startsAt.getTime() + dto.durationMinutes * 60_000,
      );
      data.endsAt = newEndsAt;

      // Cantidad de bloques extra ocupados al extender el turno
      const slotMs = (existing.employee.slotMinutes ?? 30) * 60_000;
      const extraSlots = Math.round(
        (newEndsAt.getTime() - existing.endsAt.getTime()) / slotMs,
      );
      if (extraSlots > 0) {
        data.extendedSlots = { increment: extraSlots };
      }
    }

    try {
      // Al completar el turno, actualizar lastVisitAt del cliente en una transacción
      const markCompleted = dto.status === 'COMPLETED';
      const updated = markCompleted
        ? await this.appointmentsRepository.updateAppointmentWithLastVisit(
            id,
            data,
            existing.startsAt,
          )
        : await this.appointmentsRepository.updateAppointment(id, data);
      if (!updated) {
        throw new NotFoundException('Appointment not found');
      }
      return updated;
    } catch (error) {
      if (this.isOverlapError(error)) {
        throw new ConflictException(
          'Ese horario ya está ocupado para este empleado',
        );
      }
      throw error;
    }
  }

  // ── Portal público ──────────────────────────────────────────────────────

  // Próximos turnos activos de un cliente por teléfono
  findUpcomingByPhone(phone: string) {
    return this.appointmentsRepository.findUpcomingByPhone(phone, new Date());
  }

  // Turno por id verificando el teléfono del cliente
  findByIdAndPhone(id: string, phone: string) {
    return this.appointmentsRepository.findByIdAndPhone(id, phone);
  }

  // Cancela un turno (usado por el portal público tras validar el teléfono)
  async cancelAppointment(id: string) {
    const updated = await this.appointmentsRepository.updateAppointment(id, {
      status: 'CANCELLED',
    });
    if (!updated) {
      throw new NotFoundException('Appointment not found');
    }
    return updated;
  }

  // Elimina un turno por su ID
  async removeAppointment(id: string) {
    const deletedAppointment =
      await this.appointmentsRepository.removeAppointment(id);

    if (!deletedAppointment) {
      throw new NotFoundException('Appointment not found');
    }

    return deletedAppointment;
  }

  private isOverlapError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }
    const message = (error.meta as { message?: unknown } | undefined)?.message;
    return (
      typeof message === 'string' &&
      message.includes('no_overlapping_appointments')
    );
  }
}

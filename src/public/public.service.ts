import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { envs } from '../common/configs/envs';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly customersService: CustomersService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  // Profesionales disponibles para reservar (id + nombre)
  listEmployees() {
    return this.employeesService.findPublicEmployees();
  }

  // Reserva un turno desde la web pública: crea/encuentra al cliente por teléfono
  // y crea el turno sin servicio (el servicio se asigna después).
  async createBooking(dto: CreatePublicAppointmentDto) {
    let customer = await this.customersService.findByPhone(dto.phone);

    if (!customer) {
      customer = await this.customersService.createCustomer({
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
      });
    }

    return this.appointmentsService.createAppointment({
      customerId: customer.id,
      employeeId: dto.employeeId,
      startsAt: dto.startsAt,
      durationMinutes: dto.durationMinutes,
      notes: dto.notes,
    });
  }

  // Próximos turnos del cliente (por teléfono), con si es cancelable o no.
  async listUpcoming(phone: string) {
    const normalized = phone.trim();
    const appointments =
      await this.appointmentsService.findUpcomingByPhone(normalized);
    const cutoff = Date.now() + envs.cancellationCutoffHours * 3_600_000;

    return {
      items: appointments.map((a) => ({
        id: a.id,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        employeeName: a.employee.name,
        cancellable: a.startsAt.getTime() > cutoff,
      })),
    };
  }

  // Cancela un turno verificando que el teléfono coincida y respetando el cutoff.
  async cancel(id: string, phone: string) {
    const normalized = phone.trim();
    const appointment = await this.appointmentsService.findByIdAndPhone(
      id,
      normalized,
    );

    // 404 genérico para no filtrar si el turno existe o no
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (
      appointment.status !== 'PENDING' &&
      appointment.status !== 'CONFIRMED'
    ) {
      throw new BadRequestException('Appointment cannot be cancelled');
    }

    const cutoff = Date.now() + envs.cancellationCutoffHours * 3_600_000;
    if (appointment.startsAt.getTime() <= cutoff) {
      throw new BadRequestException(
        `Appointment can only be cancelled at least ${envs.cancellationCutoffHours} hours in advance`,
      );
    }

    await this.appointmentsService.cancelAppointment(id);
    return { id, status: 'CANCELLED' };
  }
}

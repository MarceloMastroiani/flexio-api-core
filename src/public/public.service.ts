import { Injectable } from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { AppointmentsService } from '../appointments/appointments.service';
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
}

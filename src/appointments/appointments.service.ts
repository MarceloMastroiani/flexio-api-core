import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsRepository } from './appointments.repository';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { ServicesService } from '../services/services.service';
import { Prisma } from '@/generated/prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly employeesService: EmployeesService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService) {
  }

  async createAppointment(createAppointmentDto: CreateAppointmentDto) {

    // Verify employee, customer, and service
    const verifyEmployee = await this.employeesService.findOneEmployee(createAppointmentDto.employeeId);

    const verifyCustomer = await this.customersService.findOneCustomer(createAppointmentDto.customerId);

    const verifyService = await this.servicesService.findServicesByIds(createAppointmentDto.serviceIds);

    if (!verifyEmployee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }
    if (!verifyCustomer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    if (verifyService.length !== createAppointmentDto.serviceIds.length) {
      throw new HttpException('One or more services not found', HttpStatus.NOT_FOUND);
    }

    const startsAt = new Date(createAppointmentDto.startsAt);
    const totalDuration = verifyService.reduce((acc, service) => acc + service.duration, 0)
    const endsAt = new Date(startsAt.getTime() + totalDuration * 60_000);

    const isAvailable = await this.appointmentsRepository.checkAvailability(
      createAppointmentDto.employeeId,
      startsAt,
      endsAt,
    );

    if (!isAvailable) {
      throw new ConflictException('That time slot is already occupied for this employee');
    }

    try {
      return await this.appointmentsRepository.createAppointment({
        employeeId: createAppointmentDto.employeeId,
        customerId: createAppointmentDto.customerId,
        serviceIds: createAppointmentDto.serviceIds,
        startsAt,
        endsAt,
        notes: createAppointmentDto.notes ?? undefined,
      });
    } catch (error) {
      if (
             error instanceof Prisma.PrismaClientKnownRequestError &&
             String(error.meta?.message ?? '').includes('no_overlapping_appointments')
           ) {
             throw new ConflictException('Ese horario ya está ocupado para este empleado');
           }
      throw error;

    }
  }

  findAllAppointments() {
    const appointments = this.appointmentsRepository.findAllAppointments();

    if(!appointments) {
      throw new HttpException('No appointments found', HttpStatus.NOT_FOUND);
    }

    return appointments;
  }

  findOne(id: number) {
    return `This action returns a #${id} appointment`;
  }

  update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    return `This action updates a #${id} appointment`;
  }

  remove(id: number) {
    return `This action removes a #${id} appointment`;
  }
}

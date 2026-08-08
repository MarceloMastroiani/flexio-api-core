import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsRepository } from './appointments.repository';
import { EmployeesService } from '../employees/employees.service';
import { CustomersService } from '../customers/customers.service';
import { ServicesService } from '../services/services.service';
import { Prisma } from '@/generated/prisma/client';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { calculateAvailableSlots } from './helpers/availability.helper';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly employeesService: EmployeesService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService) {
  }

  // Obtiene los horarios disponibles para un empleado y un servicio en una fecha específica
  async getAvailableSlots(getAvailableSlotsDto: GetAvailableSlotsDto) {
    const { employeeId, serviceId, date } = getAvailableSlotsDto;

    const employee = await this.appointmentsRepository.getEmployeeWithAvailability(employeeId);
    if (!employee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }

    const service = await this.appointmentsRepository.getServiceDuration(serviceId);
    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    const targetDate = new Date(date);
    const dayStart = new Date(Date.UTC(
      targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0,
    ));
    const dayEnd = new Date(Date.UTC(
      targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999,
    ));

    const busyAppointments = await this.appointmentsRepository.getBusyAppointments(
      employeeId, dayStart, dayEnd,
    );

    const busyRanges = busyAppointments.map((a) => ({
      start: a.startsAt,
      end: a.endsAt,
    }));

    return calculateAvailableSlots(
      dayStart,
      employee.availability as Record<string, { start: string; end: string }[]>,
      service.duration,
      busyRanges,
    );
  }

  // Crea un nuevo turno
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


  findAvailableAppointments() {
    const appointments = this.appointmentsRepository.findAvailableAppointments();

    if (!appointments) {
      throw new HttpException('No available appointments found', HttpStatus.NOT_FOUND);
    }
    return appointments;
  }

  // Obtiene todos los turnos
  findAllAppointments() {
    const appointments = this.appointmentsRepository.findAllAppointments();

    if (!appointments) {
      throw new HttpException('No appointments found', HttpStatus.NOT_FOUND);
    }

    return appointments;
  }

  // Obtiene todos los turnos de hoy
  findToday() {
    const appointmentsToday = this.appointmentsRepository.findToday();

    if (!appointmentsToday) {
      throw new HttpException('No appointments found', HttpStatus.NOT_FOUND);
    }

    return appointmentsToday;
  }

  // Actualiza el estado de un turno
  async updateStatusAppointment(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const updatedAppointment = await this.appointmentsRepository.updateStatusAppointment(id, updateAppointmentDto)

    if (!updatedAppointment) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }

    return updatedAppointment;
  }

  // Elimina un turno por su ID
  async removeAppointment(id: string) {
    const deletedAppointment = await this.appointmentsRepository.removeAppointment(id);

    if (!deletedAppointment) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }

    return deletedAppointment
  }

}

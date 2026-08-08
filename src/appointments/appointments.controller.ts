import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';


@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  // Obtiene los horarios disponibles para un empleado y un servicio en una fecha específica
  @Get('available')
  getAvailableSlots(@Query() getAvailableSlotsDto: GetAvailableSlotsDto) {
    return this.appointmentsService.getAvailableSlots(getAvailableSlotsDto);
  }

  // Crea un nuevo turno (público)
  @Post()
  createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.createAppointment(createAppointmentDto);

    /*
     * NOTE: Se verifica la disponibilidad del empleado y se crea el turno en la base de datos.
     * TEST: "Race condition" -> Volver a crear un turno para el mismo empleado y verificar que no se puede.
     * Se debería devolver un error "409 Conflict" indicando que el empleado ya tiene un turno en ese horario.
     * Probar un tercer request con el mismo "employeeId" pero un "startsAt" que caiga dentro de este rango
     */
  }

  // TODO: Terminar este endpoint
  // Obtiene los turnos disponibles (público)
  @Get('available')
  findAvailableAppointments() {
    return this.appointmentsService.findAvailableAppointments();
  }

  // Obtiene todos los turnos (admin)
  @Get()
  findAllAppointments() {
    return this.appointmentsService.findAllAppointments();
  }

  // Obtiene un turno por su ID (admin/staff)
  @Get('today')
  findToday() {
    return this.appointmentsService.findToday();
  }

  // Actualiza el estado de un turno (admin)
  @Patch(':id')
  updateStatusAppointment(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.updateStatusAppointment(id, updateAppointmentDto);
  }

  // Elimina un turno (admin)
  @Delete(':id')
  removeAppointment(@Param('id') id: string) {
    return this.appointmentsService.removeAppointment(id);
  }
}

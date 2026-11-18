import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Obtiene los horarios disponibles de un empleado en una fecha (público)
  @Get('available')
  getAvailableSlots(@Query() getAvailableSlotsDto: GetAvailableSlotsDto) {
    return this.appointmentsService.getAvailableSlots(getAvailableSlotsDto);
  }

  // Crea un nuevo turno (público)
  @Post()
  createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(createAppointmentDto);
  }

  // Obtiene todos los turnos
  @Get()
  findAllAppointments() {
    return this.appointmentsService.findAllAppointments();
  }

  // Obtiene los turnos de hoy
  @Get('today')
  findToday() {
    return this.appointmentsService.findToday();
  }

  // Actualiza estado / servicio / duración de un turno
  @Patch(':id')
  updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.updateAppointment(id, updateAppointmentDto);
  }

  // Elimina un turno
  @Delete(':id')
  removeAppointment(@Param('id') id: string) {
    return this.appointmentsService.removeAppointment(id);
  }
}

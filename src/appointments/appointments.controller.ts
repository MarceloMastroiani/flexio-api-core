import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorador';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Obtiene los horarios disponibles de un empleado en una fecha (público)
  @Get('available')
  getAvailableSlots(@Query() getAvailableSlotsDto: GetAvailableSlotsDto) {
    return this.appointmentsService.getAvailableSlots(getAvailableSlotsDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  // Crea un nuevo turno (privado)
  @Post()
  createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(createAppointmentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  // Obtiene todos los turnos (privado)
  @Get()
  findAllAppointments() {
    return this.appointmentsService.findAllAppointments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','STAFF')
  // Obtiene los turnos de hoy (privado)
  @Get('today')
  findToday() {
    return this.appointmentsService.findToday();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','STAFF')
  // Actualiza estado / servicio / duración de un turno (privado)
  @Patch(':id')
  updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.updateAppointment(id, updateAppointmentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  // Elimina un turno (privado)
  @Delete(':id')
  removeAppointment(@Param('id') id: string) {
    return this.appointmentsService.removeAppointment(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorador';
import { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Obtiene los horarios disponibles de un empleado en una fecha.
  // Es público: lo usa el booking público y también el panel para extender turnos.
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
  @Roles('ADMIN', 'STAFF')
  // Lista paginada de turnos con filtros (privado). STAFF solo ve los propios.
  @Get()
  findAllAppointments(
    @Query() query: FindAppointmentsQueryDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.appointmentsService.findPaged(query, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  // Obtiene los turnos de hoy (privado). STAFF solo ve los propios.
  @Get('today')
  findToday(@Request() req: { user: AuthenticatedUser }) {
    return this.appointmentsService.findToday(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  // Actualiza estado / servicio / duración de un turno (privado).
  @Patch(':id')
  updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.appointmentsService.updateAppointment(
      id,
      updateAppointmentDto,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  // Elimina un turno (privado)
  @Delete(':id')
  removeAppointment(@Param('id') id: string) {
    return this.appointmentsService.removeAppointment(id);
  }
}

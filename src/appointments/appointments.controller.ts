import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

// TODO: Crear todos los endpoints
  // TODO:
  // POST ✔️
  // GET ✔️
  // PATCH ❌
  // DELETE ❌
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

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

  @Get()
  findAllAppointments() {
    return this.appointmentsService.findAllAppointments();
  }






  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(+id, updateAppointmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(+id);
  }
}

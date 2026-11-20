import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';
import { PublicPhoneQueryDto } from './dto/public-phone-query.dto';
import { CancelPublicAppointmentDto } from './dto/cancel-public-appointment.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Lista reducida de profesionales para el booking público (sin login)
  @Get('employees')
  listEmployees() {
    return this.publicService.listEmployees();
  }

  // Próximos turnos del cliente por teléfono (para gestionar/cancelar)
  @Get('appointments')
  listUpcoming(@Query() dto: PublicPhoneQueryDto) {
    return this.publicService.listUpcoming(dto.phone);
  }

  // Reserva un turno sin necesidad de estar autenticado
  @Post('appointments')
  createBooking(@Body() dto: CreatePublicAppointmentDto) {
    return this.publicService.createBooking(dto);
  }

  // Cancela un turno público (valida teléfono y anticipación mínima)
  @Post('appointments/:id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelPublicAppointmentDto) {
    return this.publicService.cancel(id, dto.phone);
  }
}

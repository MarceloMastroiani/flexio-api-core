import { Body, Controller, Get, Post } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Lista reducida de profesionales para el booking público (sin login)
  @Get('employees')
  listEmployees() {
    return this.publicService.listEmployees();
  }

  // Reserva un turno sin necesidad de estar autenticado
  @Post('appointments')
  createBooking(@Body() dto: CreatePublicAppointmentDto) {
    return this.publicService.createBooking(dto);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CashService } from './cash.service';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorador';

// TODO: Probar controlador una vez que este hecho el modulo de Appointment
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(":appointmentId")
  createPayments(@Param('appointmentId') appointmentId: string, @Body() createCashDto: CreateCashDto) {
    return this.cashService.createPayments(appointmentId, createCashDto);
  }

  // TODO: Completar una vez terminado el Appointment
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('payments/day')
  dailyPayments(@Query("date") date: string) {
    return this.cashService.dailyPayments(date);
  }

  // TODO: Completar una vez terminado el Appointment
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get("payments/cash-close")
  cashClose(@Query("date") date: string) {
    return this.cashService.getCashClose(date);
  }

  // ========================================================== //

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAllPayments() {
    return this.cashService.findAllPayments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOnePayment(@Param('id') id: string) {
    return this.cashService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('appointment/:appointmentId')
  findPaymentsByAppointmentId(@Param('appointmentId') appointmentId: string) {
    return this.cashService.findByAppointmentId(appointmentId);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  updatePayment(@Param('id') id: string, @Body() updateCashDto: UpdateCashDto) {
    return this.cashService.updatePayment(id, updateCashDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  removePayment(@Param('id') id: string) {
    return this.cashService.removePayment(id);
  }
}

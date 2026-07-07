import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorador';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post()
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.createCustomer(createCustomerDto);
  }

  // HACER EN EL APPOINTMENTS (FLEXIO VERTICAL)
  // POST /appointments — Creación implícita
  // Creación implícita en POST /appointments — para el flujo normal de reserva, que es el caso de uso más frecuente y no debería requerir dos requests separados del frontend.
  // @Post('appointments')
  // async createAppointment(dto: CreateAppointmentDto) {
  //   return ' ';
  //   // Se crea automáticamente el cliente si no existe, y luego se manda al AppointmentService para crear el turno con el Customer.id y ...dto con los datos del turno
  // }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAllCustomers() {
    return this.customersService.findAllCustomers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOneCustomer(@Param('id') id: string) {
    return this.customersService.findOneCustomer(id);
  }

  // HACER EN EL APPOINTMENTS (FLEXIO VERTICAL)
  // GET /customers/:id/appointments -> turnos del cliente
  //
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  // @Get(':id/appointments')
  // findCustomerAppointments(@Param('id') id: string) {
  //   return this.customersService.findCustomerAppointments(id);
  // }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(id, updateCustomerDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  removeCustomer(@Param('id') id: string) {
    return this.customersService.removeCustomer(id);
  }
}

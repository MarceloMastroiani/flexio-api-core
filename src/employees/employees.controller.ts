import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeWithUserDto } from './dto/create-employee-with-user.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorador';
import { AuthenticatedUser } from '../common/types/authenticated-user';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Alta en un solo paso: crea el usuario STAFF + empleado.
  @Post()
  createEmployeeWithUser(@Body() createEmployeeDto: CreateEmployeeWithUserDto) {
    return this.employeesService.createEmployeeWithUser(createEmployeeDto);
  }

  // Vincula un usuario STAFF ya existente.
  @Post(':userId')
  createEmployee(
    @Param('userId') userId: string,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.createEmployee(userId, createEmployeeDto);
  }

  // ADMIN ve todos; STAFF solo su propio empleado.
  @Get()
  @Roles('ADMIN', 'STAFF')
  findAll(@Request() req: { user: AuthenticatedUser }) {
    return this.employeesService.findAllEmployees(req.user);
  }

  @Patch(':id')
  updateEmployee(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(id, updateEmployeeDto);
  }

  @Delete(':id')
  deleteEmployee(@Param('id') id: string) {
    return this.employeesService.deleteEmployee(id);
  }
}

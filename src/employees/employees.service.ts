import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesRepository } from './employees.repository';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly authService: AuthService,
  ) {}

  async createEmployee(userId: string, createEmployeeDto: CreateEmployeeDto) {
    const user = await this.authService.findOneUser(userId);

    if (!user) {
      throw new HttpException(
        'Failed to find user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // El email del empleado se toma del usuario vinculado (salvo que se envíe y coincida)
    const email = createEmployeeDto.email ?? user.email;
    if (createEmployeeDto.email && createEmployeeDto.email !== user.email) {
      throw new HttpException('Email does not match', HttpStatus.BAD_REQUEST);
    }

    const newEmployee = await this.employeesRepository.createEmployee(
      { ...createEmployeeDto, email },
      userId,
    );

    if (!newEmployee) {
      throw new HttpException(
        'Failed to create employee',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return newEmployee;
  }

  async findAllEmployees() {
    const employees = await this.employeesRepository.findAllEmployees();

    if (!employees) {
      throw new HttpException(
        'Failed to find employees',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return employees;
  }

  // Lista reducida para el booking público (sin datos sensibles)
  async findPublicEmployees() {
    return this.employeesRepository.findPublicEmployees();
  }

  async findOneEmployee(id: string) {
    return this.employeesRepository.findOneEmployee(id);
  }

  async updateEmployee(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.employeesRepository.updateEmployee(
      id,
      updateEmployeeDto,
    );

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async deleteEmployee(id: string) {
    const deletedEmployee = await this.employeesRepository.deleteEmployee(id);

    if (!deletedEmployee) {
      throw new NotFoundException('Employee not found');
    }

    return deletedEmployee;
  }
}

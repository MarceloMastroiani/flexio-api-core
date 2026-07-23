import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesRepository } from './employees.repository';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly authService: AuthService,
  ) { }

  async createEmployee(userId: string, createEmployeeDto: CreateEmployeeDto) {

    // NOTE: Probar si el usuario existe antes de crear el empleado (Siempre tendria que existir el usuario para crear un empleado)
    // NOTE CASO 1: Si no existe, lanzar un error
    // NOTE CASO 2: Si existe, crear el empleado con los datos proporcionados por el USER, no hace falta usar DTO ni enviar por body datos nuevos
    const user = await this.authService.findOneUser(userId);

    if (!user) {
      throw new HttpException('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (user.email !== createEmployeeDto.email) {
      throw new HttpException('Email does not match', HttpStatus.BAD_REQUEST);
    }

    const newEmployee = this.employeesRepository.createEmployee(createEmployeeDto, userId);

    if (!newEmployee) {
      throw new HttpException('Failed to create employee', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return newEmployee;

  }

  findAll() {
    const employees = this.employeesRepository.findAll();

    if (!employees) {
      throw new HttpException('Failed to find employees', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return employees;
  }

  updateEmployee(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = this.employeesRepository.updateEmployee(id, updateEmployeeDto);

    if (!employee) {
      throw new HttpException('Failed to update employee', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return employee;
  }

  deleteEmployee(id: string) {
    const deletedEmployee = this.employeesRepository.deleteEmployee(id);

    if (!deletedEmployee) {
      throw new HttpException('Failed to delete employee', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return deletedEmployee;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeWithUserDto } from './dto/create-employee-with-user.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesRepository } from './employees.repository';
import { AuthService } from '../auth/auth.service';
import { Prisma } from '../../generated/prisma/client';
import {
  generateTemporaryPassword,
  hashPassword,
} from '../common/helpers/hash-password.helpers';
import { AuthenticatedUser } from '../common/types/authenticated-user';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly authService: AuthService,
  ) {}

  /**
   * Alta de empleado en un solo paso: crea el User STAFF + Employee.
   * Devuelve la contraseña temporal solo si el backend la generó.
   */
  async createEmployeeWithUser(createEmployeeDto: CreateEmployeeWithUserDto) {
    const generatedPassword = !createEmployeeDto.password;
    const plainPassword =
      createEmployeeDto.password ?? generateTemporaryPassword();
    const hashedPassword = await hashPassword(plainPassword);

    try {
      const { employee } =
        await this.employeesRepository.createEmployeeWithUser(
          createEmployeeDto,
          hashedPassword,
        );

      return {
        ...employee,
        ...(generatedPassword ? { temporaryPassword: plainPassword } : {}),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un usuario o empleado con ese email',
        );
      }
      throw error;
    }
  }

  /** Vincula un usuario STAFF ya existente a un empleado. */
  async createEmployee(userId: string, createEmployeeDto: CreateEmployeeDto) {
    const user = await this.authService.findOneUser(userId);

    if (user.role !== 'STAFF') {
      throw new BadRequestException(
        'El usuario vinculado debe tener rol STAFF',
      );
    }

    const existingEmployee =
      await this.employeesRepository.findByUserId(userId);
    if (existingEmployee) {
      throw new ConflictException('El usuario ya está vinculado a un empleado');
    }

    // El email del empleado se toma del usuario vinculado (salvo que se envíe y coincida)
    const email = createEmployeeDto.email ?? user.email;
    if (createEmployeeDto.email && createEmployeeDto.email !== user.email) {
      throw new HttpException('Email does not match', HttpStatus.BAD_REQUEST);
    }

    try {
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un empleado con ese email');
      }
      throw error;
    }
  }

  async findAllEmployees(user?: AuthenticatedUser) {
    // STAFF solo ve su propio empleado (id y nombre) para la UI.
    if (user?.role === 'STAFF') {
      const employee = await this.employeesRepository.findByUserId(user.userId);
      if (!employee) {
        throw new ForbiddenException(
          'Tu usuario no está vinculado a un empleado',
        );
      }
      return [{ id: employee.id, name: employee.name }];
    }

    return this.employeesRepository.findAllEmployees();
  }

  // Lista reducida para el booking público (sin datos sensibles)
  async findPublicEmployees() {
    return this.employeesRepository.findPublicEmployees();
  }

  async findOneEmployee(id: string) {
    return this.employeesRepository.findOneEmployee(id);
  }

  /** Empleado asociado a un usuario (para el scoping del rol STAFF). */
  async findEmployeeByUserId(userId: string) {
    return this.employeesRepository.findByUserId(userId);
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

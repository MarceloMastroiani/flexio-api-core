import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Employee, Prisma } from '@/generated/prisma/client';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    userId: string,
  ): Promise<Employee> {
    const { availability, name, email, slotMinutes } = createEmployeeDto;

    const newEmployee = await this.prisma.employee.create({
      data: {
        name,
        email,
        availability: JSON.parse(
          JSON.stringify(availability),
        ) as Prisma.InputJsonValue,
        slotMinutes: slotMinutes ?? 30,
        userId,
      },
    });
    return newEmployee;
  }

  async findAllEmployees(): Promise<Employee[]> {
    return this.prisma.employee.findMany();
  }

  // Solo id y nombre, para el booking público
  async findPublicEmployees(): Promise<Pick<Employee, 'id' | 'name'>[]> {
    return this.prisma.employee.findMany({
      select: { id: true, name: true },
    });
  }

  async findOneEmployee(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
    });
  }

  async deleteEmployee(id: string): Promise<Employee> {
    return this.prisma.employee.delete({
      where: { id },
    });
  }

  async updateEmployee(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const data: Prisma.EmployeeUpdateInput = {};

    if (updateEmployeeDto.name !== undefined)
      data.name = updateEmployeeDto.name;
    if (updateEmployeeDto.email !== undefined)
      data.email = updateEmployeeDto.email;
    if (updateEmployeeDto.slotMinutes !== undefined) {
      data.slotMinutes = updateEmployeeDto.slotMinutes;
    }
    if (updateEmployeeDto.availability !== undefined) {
      data.availability = JSON.parse(
        JSON.stringify(updateEmployeeDto.availability),
      ) as Prisma.InputJsonValue;
    }

    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }
}

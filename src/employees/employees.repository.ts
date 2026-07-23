import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Employee } from '@/generated/prisma/client';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createEmployee(createEmployeeDto: CreateEmployeeDto, userId: string): Promise<Employee> {
    const { availability, name, email } = createEmployeeDto;

    const newEmployee = await this.prisma.employee.create({
      data: {
        name,
        email,
        availability: JSON.parse(JSON.stringify(availability)) ,
        userId: userId,
      },
    });
    return newEmployee;
  }

  async findAll(): Promise<Employee[]> {
    const employees = await this.prisma.employee.findMany();
    return employees;
  }

  async deleteEmployee(id: string): Promise<Employee> {
    const deletedEmployee = await this.prisma.employee.delete({
      where: { id },
    });
    return deletedEmployee;
  }

  async updateEmployee(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const { availability, name, email } = updateEmployeeDto;
    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: {
        name,
        email,
        availability: JSON.parse(JSON.stringify(availability)) ,
      },
    });
    return updatedEmployee;
  }
}

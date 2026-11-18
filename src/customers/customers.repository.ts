import { Injectable } from '@nestjs/common';
import { Customer, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new customer
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const newCustomer = await this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        phone: createCustomerDto.phone ?? null,
        email: createCustomerDto.email ?? null,
      },
    });

    return newCustomer;
  }

  // Find all customers
  async findAll(): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany();

    return customers;
  }

  // Find a customer by id
  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    return customer;
  }

  // Find a customer by phone
  async findByPhone(phone: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { phone },
    });
    return customer;
  }

  // Find a customer by email
  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });
    return customer;
  }

  // Update a customer
  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const data: Prisma.CustomerUpdateInput = {};
    if (updateCustomerDto.name !== undefined)
      data.name = updateCustomerDto.name;
    if (updateCustomerDto.phone !== undefined)
      data.phone = updateCustomerDto.phone;
    if (updateCustomerDto.email !== undefined)
      data.email = updateCustomerDto.email;

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data,
    });

    return updatedCustomer;
  }

  // Remove a customer
  async remove(id: string): Promise<Customer> {
    const removedCustomer = await this.prisma.customer.delete({
      where: { id },
    });

    return removedCustomer;
  }
}

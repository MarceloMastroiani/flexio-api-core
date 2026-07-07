import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Customer } from '@/generated/prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new customer
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const newCustomer = await this.prisma.customer.create({
      data: createCustomerDto,
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
    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });

    return updatedCustomer;
  }

  // Remove a customer
  async remove(id: string): Promise<Customer | null> {
    const removedCustomer = await this.prisma.customer.delete({
      where: { id },
    });

    return removedCustomer;
  }
}

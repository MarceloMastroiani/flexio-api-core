import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersRepository } from './customers.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createCustomer(createCustomerDto: CreateCustomerDto) {
    // Verificar si el teléfono ya existe
    if (createCustomerDto.phone) {
      const verifiedCustomer = await this.customersRepository.findByPhone(
        createCustomerDto.phone,
      );
      if (verifiedCustomer) {
        throw new HttpException('Phone already exists', HttpStatus.BAD_REQUEST);
      }
    }
    // Verificar si el email ya existe
    if (createCustomerDto.email) {
      const verifiedCustomer = await this.customersRepository.findByEmail(
        createCustomerDto.email,
      );
      if (verifiedCustomer) {
        throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
      }
    }

    // Crear el nuevo cliente si no existe un cliente con el mismo teléfono o email
    const newCustomer =
      await this.customersRepository.create(createCustomerDto);

    if (!newCustomer) {
      throw new HttpException(
        'Failed to create customer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //   await this.notificationsService.sendEmail(
    //     newCustomer.email ?? '',
    //     'Turno creado',
    //     `
    // Hola ${newCustomer.name} 👋

    // Tu turno fue confirmado correctamente.

    // 📅 Fecha: 12/07/2026
    // 🕒 Hora: 15:30
    // 💇 Servicio: Corte de pelo

    // ¡Te esperamos!
    // `,
    //   );

    return newCustomer;
  }

  async findAllCustomers() {
    const customers = await this.customersRepository.findAll();

    if (!customers) {
      throw new HttpException('No customers found', HttpStatus.NOT_FOUND);
    }

    return customers;
  }

  async findOneCustomer(id: string) {
    const customer = await this.customersRepository.findById(id);

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    return customer;
  }

  updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto) {
    const updatedCustomer = this.customersRepository.update(
      id,
      updateCustomerDto,
    );

    if (!updatedCustomer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    return updatedCustomer;
  }

  async removeCustomer(id: string) {
    const removedCustomer = await this.customersRepository.remove(id);

    if (!removedCustomer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    return removedCustomer;
  }
}

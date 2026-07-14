import { HttpException, Injectable } from '@nestjs/common';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';
import { CashRepository } from './cash.repository';
import { CustomersService } from '../customers/customers.service';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class CashService {

  constructor(
    private readonly cashRepository: CashRepository,
    private readonly customersService: CustomersService,
  ) { }

  async createPayments(customerId: string, createCashDto: CreateCashDto) {
    const customer = await this.customersService.findOneCustomer(customerId);

    const newPayment = await this.cashRepository.createPayment(customerId,createCashDto);

    if (!newPayment) {
      throw new HttpException('Failed to create payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return newPayment;
  }


  async dailyPayments(date: string) {
    const paymentsDate = await this.cashRepository.getPaymentsByDate(date);

    if (!paymentsDate) {
      throw new HttpException('Failed to get payments', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return paymentsDate;
  }

  async findAllPayments() {
    const payments = await this.cashRepository.getAllPayments();

    if (!payments) {
      throw new HttpException('Failed to get payments', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return payments;
  }

  async findById(id: string) {
    const paymentById = await this.cashRepository.getPaymentById(id);

    if (!paymentById) {
      throw new HttpException('Failed to get payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return paymentById;
  }

  async findByCustomerId(customerId: string) {
    const paymentsByCustomerId = await this.cashRepository.getPaymentsByCustomerId(customerId);

    if (!paymentsByCustomerId) {
      throw new HttpException('Failed to get payments', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return paymentsByCustomerId;
  }

  update(id: number, updateCashDto: UpdateCashDto) {
    return `This action updates a #${id} cash`;
  }

  remove(id: number) {
    return `This action removes a #${id} cash`;
  }
}

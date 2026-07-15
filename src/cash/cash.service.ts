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
  ) { }

  // Create a new payment for the given appointment
  async createPayments(appointmentId: string, createCashDto: CreateCashDto) {
    const newPayment = await this.cashRepository.createPayment(appointmentId, createCashDto);

    if (!newPayment) {
      throw new HttpException('Failed to create payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return newPayment;
  }

  // Traer todos los pagos de un día con la fecha que se proporciona
  // cobros del día
  async dailyPayments(date: string) {
    const paymentsDate = await this.cashRepository.getPaymentsByDate(date);

    if (!paymentsDate || paymentsDate.length === 0) {
      throw new HttpException('Failed to get payments', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return paymentsDate;
  }

  // Get the cash close for the given date
  // Resumen del cierre de caja
  async getCashClose(date: string) {
    const cashClose = await this.cashRepository.getCashClose(date);

    if (!cashClose) {
      throw new HttpException('Failed to get cash close', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return cashClose;
  }

// ========================================================== //


  // Get all payments for the given date
  async findAllPayments() {
    const payments = await this.cashRepository.getAllPayments();

    if (!payments || payments.length === 0) {
      throw new HttpException('Failed to get payments', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return payments;
  }

  // Get a payment by its ID
  async findById(id: string) {
    const paymentById = await this.cashRepository.getPaymentById(id);

    if (!paymentById || paymentById[0] === undefined) {
      throw new HttpException('Failed to get payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return paymentById;
  }

  // Get all payments for the given appointment ID
  async findByAppointmentId(appointmentId: string) {
    const paymentsByAppointmentId = await this.cashRepository.getPaymentsByAppointmentId(appointmentId);

    if (!paymentsByAppointmentId || paymentsByAppointmentId.length === 0) {
      throw new HttpException('Failed to get payments', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return paymentsByAppointmentId;
  }

  // Update a payment by its ID
  async updatePayment(id: string, updateCashDto: UpdateCashDto) {
    const updatedPayment = await this.cashRepository.updatePayment(id, updateCashDto);

    if (!updatedPayment) {
      throw new HttpException('Failed to update payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return updatedPayment;
  }

  // Remove a payment by its ID
  async removePayment(id: string) {
    const removedPayment = await this.cashRepository.removePayment(id);

    if (!removedPayment) {
      throw new HttpException('Failed to remove payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return removedPayment;
  }
}

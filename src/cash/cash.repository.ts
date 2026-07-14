import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { Payment } from "@/generated/prisma/client";
import { CreateCashDto } from "./dto/create-cash.dto";

@Injectable()
export class CashRepository {
  constructor(private readonly prisma: PrismaService) {}


  async createPayment(customerId: string, createCashDto: CreateCashDto): Promise<Payment> {

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    const newPayment = await this.prisma.payment.create({
      data: { ...createCashDto, customerId },
    });

    return newPayment;
  }


  // TODO: Hacer "pnpm dlx prisma migrate dev --name get-payments-by-date"
  // TODO: Hacer "pnpm dlx prisma generate"
  // TODO: Terminar
  async getPaymentsByDate(date: string): Promise<Payment[]> {

    const target = new Date(date);

    const startOfDay = new Date(Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      23, 59, 59, 999
    ));
    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      // include: { appointment: true },
    });

    return payments;
  }

  async getAllPayments(): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany();

    return payments;
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    return payment;
  }

  async getPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { customerId },
    });

    return payments;
  }
}

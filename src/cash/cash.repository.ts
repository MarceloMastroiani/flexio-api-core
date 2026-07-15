import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { Payment } from "@/generated/prisma/client";
import { CreateCashDto } from "./dto/create-cash.dto";
import { HttpException, HttpStatus } from "@nestjs/common";
import { UpdateCashDto } from "./dto/update-cash.dto";

@Injectable()
export class CashRepository {
  constructor(private readonly prisma: PrismaService) {}


  async createPayment(appointmentId: string, createCashDto: CreateCashDto): Promise<Payment> {

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new HttpException("Appointment not found", HttpStatus.NOT_FOUND);
    }

    const newPayment = await this.prisma.payment.create({
      data: { ...createCashDto, appointmentId },
    });

    return newPayment;
  }

  async getPaymentsByDate(date: string): Promise<Payment[]> {

    // Convertir la fecha a un objeto Date
    const target = new Date(date);

    if (isNaN(target.getTime())) {
      throw new HttpException("Invalid date", HttpStatus.BAD_REQUEST);
    }

    // Obtener el inicio y fin del día en UTC.
    // EJ: si se pasa '2025-09-15'
    //  startOfDay: '2025-09-15T00:00:00.000Z'
    //  startOfNextDay: '2025-09-16T00:00:00.000Z'
    const startOfDay = new Date(Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      0, 0, 0, 0
    ));
    const startOfNextDay = new Date(Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate() + 1,
      0, 0, 0, 0
    ));// El startOfNextDay es el inicio del día siguiente, para incluir todos los pagos del día especificado

    // Obtener los pagos que se realizaron en el día especificado
    const payments = await this.prisma.payment.findMany({
      where: {
        paidAt: { gte: startOfDay, lt: startOfNextDay } // Incluye todos los pagos que se hicieron el día especificado
      },
      include: {
        appointment: {
            include: { service: true, customer: true },
        },
      },
    });

    return payments
  }

  async getCashClose(date: string) {
    const payments = await this.getPaymentsByDate(date);
    return payments;
    // return this.buildCashClose(payments);
  }

  // Resumen del cierre de caja
  // private buildCashClose(payments) {
  //   // Total del día
  //     const total = payments.reduce(
  //       (sum, p) => sum + Number(p.amount), 0
  //     );

  //     // Desglose por método de pago
  //     const byMethod = payments.reduce((acc, p) => {
  //       acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
  //       return acc;
  //     }, {} as Record<string, number>);

  //     // Servicio más vendido
  //     const serviceCount = payments.reduce((acc, p) => {
  //       const name = p.appointment.service.name;
  //       acc[name] = (acc[name] ?? 0) + 1;
  //       return acc;
  //     }, {} as Record<string, number>);

  //     const topService = Object.entries(serviceCount)
  //       .sort((a, b) => b[1] - a[1])[0];

  //     return {
  //       date: payments[0]?.paidAt ?? new Date(),
  //       totalAmount: total,
  //       totalPayments: payments.length,
  //       byMethod: {
  //         CASH:        byMethod.CASH        ?? 0,
  //         TRANSFER:    byMethod.TRANSFER    ?? 0,
  //         CARD:        byMethod.CARD        ?? 0,
  //         MERCADOPAGO: byMethod.MERCADOPAGO ?? 0,
  //       },
  //       topService: topService
  //         ? { name: topService[0], count: topService[1] }
  //         : null,
  //       payments: payments.map(p => ({
  //         id:         p.id,
  //         amount:     Number(p.amount),
  //         method:     p.method,
  //         notes:      p.notes,
  //         paidAt:     p.paidAt,
  //         customer:   p.appointment.customer.name,
  //         service:    p.appointment.service.name,
  //       })),
  //     };
  // }


// ========================================================== //


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

  async getPaymentsByAppointmentId(appointmentId: string): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: { appointmentId },
    });

    return payments;
  }

  async updatePayment(paymentId: string, updateCashDto: UpdateCashDto): Promise<Payment | null> {
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: updateCashDto,
    });

    return updatedPayment;
  }

  async removePayment(paymentId: string): Promise<Payment | null> {
    const removedPayment = await this.prisma.payment.delete({
      where: { id: paymentId },
    });

    return removedPayment;
  }
}

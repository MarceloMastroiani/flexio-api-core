import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface EmployeeRow {
  id: string;
  name: string;
  availability: unknown;
}

export interface EmployeeCountsRow {
  employeeId: string;
  total: number;
  completed: number;
  cancelled: number;
  extendedCount: number;
  extendedSlotsTotal: number;
}

export interface EmployeeRevenueRow {
  employeeId: string;
  revenue: number;
}

export interface OccupancyAppointmentRow {
  employeeId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
}

@Injectable()
export class EmployeesReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployees(): Promise<EmployeeRow[]> {
    return this.prisma.employee.findMany({
      select: { id: true, name: true, availability: true },
    });
  }

  async getCountsByEmployee(
    fromUtc: Date,
    toUtcExclusive: Date,
  ): Promise<EmployeeCountsRow[]> {
    return this.prisma.$queryRaw<EmployeeCountsRow[]>`
      SELECT "employeeId" AS "employeeId",
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS completed,
             COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS cancelled,
             COUNT(*) FILTER (WHERE "extendedSlots" > 0)::int AS "extendedCount",
             COALESCE(SUM("extendedSlots"), 0)::int AS "extendedSlotsTotal"
      FROM "Appointment"
      WHERE "startsAt" >= ${fromUtc} AND "startsAt" < ${toUtcExclusive}
      GROUP BY "employeeId"
    `;
  }

  async getRevenueByEmployee(
    fromUtc: Date,
    toUtcExclusive: Date,
  ): Promise<EmployeeRevenueRow[]> {
    return this.prisma.$queryRaw<EmployeeRevenueRow[]>`
      SELECT a."employeeId" AS "employeeId",
             ROUND(COALESCE(SUM(p."amount"), 0), 2)::float8 AS revenue
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      WHERE p."paidAt" >= ${fromUtc} AND p."paidAt" < ${toUtcExclusive}
      GROUP BY a."employeeId"
    `;
  }

  async getOccupancyAppointments(
    fromUtc: Date,
    toUtcExclusive: Date,
  ): Promise<OccupancyAppointmentRow[]> {
    return this.prisma.$queryRaw<OccupancyAppointmentRow[]>`
      SELECT "employeeId" AS "employeeId",
             "startsAt" AS "startsAt",
             "endsAt" AS "endsAt",
             "status"::text AS status
      FROM "Appointment"
      WHERE "status" IN ('PENDING', 'CONFIRMED', 'COMPLETED')
        AND "startsAt" < ${toUtcExclusive} AND "endsAt" > ${fromUtc}
    `;
  }
}

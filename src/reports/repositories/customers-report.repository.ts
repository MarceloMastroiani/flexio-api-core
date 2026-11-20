import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CustomerCountsRow {
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface CustomerSpendRow {
  customerId: string;
  name: string;
  visits: number;
  totalSpent: number;
}

export interface InactiveCustomerRow {
  customerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  lastVisitAt: Date | null;
}

@Injectable()
export class CustomersReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCounts(
    fromUtc: Date,
    toUtcExclusive: Date,
  ): Promise<CustomerCountsRow> {
    const rows = await this.prisma.$queryRaw<CustomerCountsRow[]>`
      WITH completed AS (
        SELECT "customerId", MIN("startsAt") AS first_completed
        FROM "Appointment"
        WHERE "status" = 'COMPLETED'
        GROUP BY "customerId"
      ),
      active AS (
        SELECT DISTINCT "customerId"
        FROM "Appointment"
        WHERE "status" = 'COMPLETED'
          AND "startsAt" >= ${fromUtc} AND "startsAt" < ${toUtcExclusive}
      )
      SELECT
        (SELECT COUNT(*)::int FROM active) AS "activeCustomers",
        (SELECT COUNT(*)::int
           FROM completed c JOIN active a ON a."customerId" = c."customerId"
          WHERE c.first_completed >= ${fromUtc} AND c.first_completed < ${toUtcExclusive}
        ) AS "newCustomers",
        (SELECT COUNT(*)::int
           FROM completed c JOIN active a ON a."customerId" = c."customerId"
          WHERE c.first_completed < ${fromUtc}
        ) AS "returningCustomers"
    `;
    return (
      rows[0] ?? { activeCustomers: 0, newCustomers: 0, returningCustomers: 0 }
    );
  }

  async getTopBySpend(
    fromUtc: Date,
    toUtcExclusive: Date,
    limit: number,
  ): Promise<CustomerSpendRow[]> {
    return this.prisma.$queryRaw<CustomerSpendRow[]>`
      SELECT c."id" AS "customerId",
             c."name" AS name,
             COUNT(DISTINCT a."id")::int AS visits,
             ROUND(COALESCE(SUM(p."amount"), 0), 2)::float8 AS "totalSpent"
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      JOIN "Customer" c ON c."id" = a."customerId"
      WHERE p."paidAt" >= ${fromUtc} AND p."paidAt" < ${toUtcExclusive}
      GROUP BY c."id", c."name"
      ORDER BY "totalSpent" DESC, visits DESC
      LIMIT ${limit}
    `;
  }

  async getTopByVisits(
    fromUtc: Date,
    toUtcExclusive: Date,
    limit: number,
  ): Promise<CustomerSpendRow[]> {
    return this.prisma.$queryRaw<CustomerSpendRow[]>`
      SELECT c."id" AS "customerId",
             c."name" AS name,
             COUNT(*)::int AS visits,
             ROUND(COALESCE(SUM(p."amount"), 0), 2)::float8 AS "totalSpent"
      FROM "Appointment" a
      JOIN "Customer" c ON c."id" = a."customerId"
      LEFT JOIN "Payment" p ON p."appointmentId" = a."id"
        AND p."paidAt" >= ${fromUtc} AND p."paidAt" < ${toUtcExclusive}
      WHERE a."status" = 'COMPLETED'
        AND a."startsAt" >= ${fromUtc} AND a."startsAt" < ${toUtcExclusive}
      GROUP BY c."id", c."name"
      ORDER BY visits DESC, "totalSpent" DESC
      LIMIT ${limit}
    `;
  }

  async getInactive(
    cutoffUtc: Date,
    limit: number,
    offset: number,
  ): Promise<{ items: InactiveCustomerRow[]; total: number }> {
    const items = await this.prisma.$queryRaw<InactiveCustomerRow[]>`
      SELECT c."id" AS "customerId", c."name" AS name, c."phone" AS phone,
             c."email" AS email, MAX(a."startsAt") AS "lastVisitAt"
      FROM "Customer" c
      LEFT JOIN "Appointment" a ON a."customerId" = c."id" AND a."status" = 'COMPLETED'
      GROUP BY c."id", c."name", c."phone", c."email", c."firstVisitAt"
      HAVING (MAX(a."startsAt") IS NOT NULL AND MAX(a."startsAt") < ${cutoffUtc})
          OR (MAX(a."startsAt") IS NULL AND c."firstVisitAt" < ${cutoffUtc})
      ORDER BY MAX(a."startsAt") ASC NULLS FIRST
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await this.prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM (
        SELECT c."id"
        FROM "Customer" c
        LEFT JOIN "Appointment" a ON a."customerId" = c."id" AND a."status" = 'COMPLETED'
        GROUP BY c."id", c."firstVisitAt"
        HAVING (MAX(a."startsAt") IS NOT NULL AND MAX(a."startsAt") < ${cutoffUtc})
            OR (MAX(a."startsAt") IS NULL AND c."firstVisitAt" < ${cutoffUtc})
      ) sub
    `;

    return { items, total: countRows[0]?.total ?? 0 };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Granularity } from '../dto/time-series-query.dto';

export interface RevenueSummaryRow {
  total: number;
  count: number;
}

export interface RevenueByMethodRow {
  method: string;
  total: number;
  count: number;
}

export interface RevenueSeriesRow {
  bucket: string;
  total: number;
  count: number;
}

@Injectable()
export class RevenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    fromUtc: Date,
    toUtcExclusive: Date,
  ): Promise<RevenueSummaryRow> {
    const rows = await this.prisma.$queryRaw<RevenueSummaryRow[]>`
      SELECT ROUND(COALESCE(SUM("amount"), 0), 2)::float8 AS total,
             COUNT(*)::int AS count
      FROM "Payment"
      WHERE "paidAt" >= ${fromUtc} AND "paidAt" < ${toUtcExclusive}
    `;
    return rows[0] ?? { total: 0, count: 0 };
  }

  async getByMethod(
    fromUtc: Date,
    toUtcExclusive: Date,
  ): Promise<RevenueByMethodRow[]> {
    return this.prisma.$queryRaw<RevenueByMethodRow[]>`
      SELECT "method"::text AS method,
             ROUND(COALESCE(SUM("amount"), 0), 2)::float8 AS total,
             COUNT(*)::int AS count
      FROM "Payment"
      WHERE "paidAt" >= ${fromUtc} AND "paidAt" < ${toUtcExclusive}
      GROUP BY "method"
    `;
  }

  async getSeries(
    fromUtc: Date,
    toUtcExclusive: Date,
    granularity: Granularity,
    tz: string,
  ): Promise<RevenueSeriesRow[]> {
    return this.prisma.$queryRaw<RevenueSeriesRow[]>`
      SELECT to_char(
               date_trunc(${granularity}::text, ("paidAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}),
               'YYYY-MM-DD'
             ) AS bucket,
             ROUND(COALESCE(SUM("amount"), 0), 2)::float8 AS total,
             COUNT(*)::int AS count
      FROM "Payment"
      WHERE "paidAt" >= ${fromUtc} AND "paidAt" < ${toUtcExclusive}
      GROUP BY 1
      ORDER BY 1
    `;
  }
}

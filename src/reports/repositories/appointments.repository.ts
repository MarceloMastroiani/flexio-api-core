import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Granularity } from '../dto/time-series-query.dto';

export interface AppointmentsSummaryRow {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  extended: number;
}

export interface AppointmentsSeriesRow {
  bucket: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface HeatmapRow {
  weekday: number;
  hour: number;
  count: number;
}

@Injectable()
export class AppointmentsReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    fromUtc: Date,
    toUtcExclusive: Date,
  ): Promise<AppointmentsSummaryRow> {
    const rows = await this.prisma.$queryRaw<AppointmentsSummaryRow[]>`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS pending,
             COUNT(*) FILTER (WHERE "status" = 'CONFIRMED')::int AS confirmed,
             COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS completed,
             COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS cancelled,
             COUNT(*) FILTER (WHERE "extendedSlots" > 0)::int AS extended
      FROM "Appointment"
      WHERE "startsAt" >= ${fromUtc} AND "startsAt" < ${toUtcExclusive}
    `;
    return (
      rows[0] ?? {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        extended: 0,
      }
    );
  }

  async getSeries(
    fromUtc: Date,
    toUtcExclusive: Date,
    granularity: Granularity,
    tz: string,
  ): Promise<AppointmentsSeriesRow[]> {
    return this.prisma.$queryRaw<AppointmentsSeriesRow[]>`
      SELECT to_char(
               date_trunc(${granularity}::text, ("startsAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}),
               'YYYY-MM-DD'
             ) AS bucket,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS completed,
             COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS cancelled
      FROM "Appointment"
      WHERE "startsAt" >= ${fromUtc} AND "startsAt" < ${toUtcExclusive}
      GROUP BY 1
      ORDER BY 1
    `;
  }

  async getHeatmap(
    fromUtc: Date,
    toUtcExclusive: Date,
    tz: string,
  ): Promise<HeatmapRow[]> {
    return this.prisma.$queryRaw<HeatmapRow[]>`
      SELECT (EXTRACT(ISODOW FROM (("startsAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})))::int AS weekday,
             (EXTRACT(HOUR FROM (("startsAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})))::int AS hour,
             COUNT(*)::int AS count
      FROM "Appointment"
      WHERE "status" <> 'CANCELLED'
        AND "startsAt" >= ${fromUtc} AND "startsAt" < ${toUtcExclusive}
      GROUP BY 1, 2
      ORDER BY 1, 2
    `;
  }
}

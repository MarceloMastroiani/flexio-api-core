import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { TopOrderBy } from '../dto/top-query.dto';

export interface TopServiceRow {
  serviceId: string;
  name: string;
  count: number;
  revenue: number;
}

export interface CoverageRow {
  completed: number;
  withServices: number;
}

/**
 * Aísla la relación turno–servicio. Hoy el esquema local usa la variante (b):
 * un único `Appointment.serviceId` + `Appointment.priceAtTime`.
 *
 * Para migrar a la variante (a) (tabla `AppointmentService` many-to-many con
 * `priceAtTime`), basta con cambiar SOLO los métodos de este archivo, manteniendo
 * el mismo contrato de entrada/salida.
 */
@Injectable()
export class ServicesReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTopServices(
    fromUtc: Date,
    toUtcExclusive: Date,
    limit: number,
    orderBy: TopOrderBy,
  ): Promise<TopServiceRow[]> {
    const orderColumn =
      orderBy === 'revenue' ? Prisma.raw('"revenue"') : Prisma.raw('"count"');

    return this.prisma.$queryRaw<TopServiceRow[]>`
      SELECT a."serviceId" AS "serviceId",
             s."name" AS name,
             COUNT(*)::int AS count,
             ROUND(COALESCE(SUM(a."priceAtTime"), 0), 2)::float8 AS revenue
      FROM "Appointment" a
      JOIN "Service" s ON s."id" = a."serviceId"
      WHERE a."status" = 'COMPLETED'
        AND a."serviceId" IS NOT NULL
        AND a."startsAt" >= ${fromUtc} AND a."startsAt" < ${toUtcExclusive}
      GROUP BY a."serviceId", s."name"
      ORDER BY ${orderColumn} DESC
      LIMIT ${limit}
    `;
  }

  async getCoverage(fromUtc: Date, toUtcExclusive: Date): Promise<CoverageRow> {
    const rows = await this.prisma.$queryRaw<CoverageRow[]>`
      SELECT COUNT(*)::int AS completed,
             COUNT(*) FILTER (WHERE "serviceId" IS NOT NULL)::int AS "withServices"
      FROM "Appointment"
      WHERE "status" = 'COMPLETED'
        AND "startsAt" >= ${fromUtc} AND "startsAt" < ${toUtcExclusive}
    `;
    return rows[0] ?? { completed: 0, withServices: 0 };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { AppointmentsReportService } from './appointments-report.service';
import { CustomersReportService } from './customers-report.service';
import { ServicesReportService } from './services-report.service';
import { EmployeesReportService } from './employees-report.service';
import { ReportsCacheService } from '../cache/reports-cache.service';
import { resolveRange, type DateRange } from '../helpers/date-range.helper';
import {
  delta,
  previousPeriod,
  type Delta,
} from '../helpers/comparison.helper';
import { buildMeta } from '../helpers/meta.helper';
import { runReport } from '../helpers/run-report.helper';
import type { SummaryQueryDto } from '../dto/summary-query.dto';
import type { ReportResponse } from '../types/report-response.type';

export type SummaryMetric = Delta | number;

export interface SummaryData {
  revenue: SummaryMetric;
  paymentsCount: SummaryMetric;
  averageTicket: SummaryMetric;
  appointmentsTotal: SummaryMetric;
  completionRatePct: SummaryMetric;
  cancellationRatePct: SummaryMetric;
  newCustomers: SummaryMetric | null;
  topService: { name: string; count: number } | null;
  occupancyPct: SummaryMetric | null;
}

interface SummaryMetrics {
  revenue: number;
  paymentsCount: number;
  averageTicket: number;
  appointmentsTotal: number;
  completionRatePct: number;
  cancellationRatePct: number;
  newCustomers: number | null;
  topService: { name: string; count: number } | null;
  occupancyPct: number | null;
}

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private readonly revenueService: RevenueService,
    private readonly appointmentsService: AppointmentsReportService,
    private readonly customersService: CustomersReportService,
    private readonly servicesService: ServicesReportService,
    private readonly employeesService: EmployeesReportService,
    private readonly cache: ReportsCacheService,
  ) {}

  async getSummary(dto: SummaryQueryDto): Promise<ReportResponse<SummaryData>> {
    const range = resolveRange(dto);
    const compare = dto.compare ?? true;
    const previous = compare
      ? previousPeriod(range.from, range.to, range.tz)
      : null;
    const previousRange = previous ? resolveRange(previous) : null;

    return runReport(
      this.logger,
      this.cache,
      'summary',
      range,
      { compare },
      async () => {
        const [current, prev] = await Promise.all([
          this.computeMetrics(range),
          previousRange
            ? this.computeMetrics(previousRange)
            : Promise.resolve(null),
        ]);

        const data: SummaryData =
          compare && prev
            ? {
                revenue: delta(current.revenue, prev.revenue),
                paymentsCount: delta(current.paymentsCount, prev.paymentsCount),
                averageTicket: delta(current.averageTicket, prev.averageTicket),
                appointmentsTotal: delta(
                  current.appointmentsTotal,
                  prev.appointmentsTotal,
                ),
                completionRatePct: delta(
                  current.completionRatePct,
                  prev.completionRatePct,
                ),
                cancellationRatePct: delta(
                  current.cancellationRatePct,
                  prev.cancellationRatePct,
                ),
                newCustomers:
                  current.newCustomers === null || prev.newCustomers === null
                    ? null
                    : delta(current.newCustomers, prev.newCustomers),
                topService: current.topService,
                occupancyPct:
                  current.occupancyPct === null || prev.occupancyPct === null
                    ? null
                    : delta(current.occupancyPct, prev.occupancyPct),
              }
            : {
                revenue: current.revenue,
                paymentsCount: current.paymentsCount,
                averageTicket: current.averageTicket,
                appointmentsTotal: current.appointmentsTotal,
                completionRatePct: current.completionRatePct,
                cancellationRatePct: current.cancellationRatePct,
                newCustomers: current.newCustomers,
                topService: current.topService,
                occupancyPct: current.occupancyPct,
              };

        return {
          meta: buildMeta(
            range,
            compare && previous ? { comparison: previous } : undefined,
          ),
          data,
        };
      },
    );
  }

  private async computeMetrics(range: DateRange): Promise<SummaryMetrics> {
    // Obligatorios: si fallan, el error se propaga.
    const [revenueReport, appointmentsReport] = await Promise.all([
      this.revenueService.getRevenue({
        from: range.from,
        to: range.to,
        granularity: 'day',
      }),
      this.appointmentsService.getReport({
        from: range.from,
        to: range.to,
        granularity: 'day',
      }),
    ]);

    // Opcionales: si fallan, el campo va null y se loguea.
    const newCustomers = await this.safe(
      async () =>
        (
          await this.customersService.getReport({
            from: range.from,
            to: range.to,
            limit: 1,
          })
        ).data.newCustomers,
      'newCustomers',
    );

    const topService = await this.safe(async () => {
      const report = await this.servicesService.getTop({
        from: range.from,
        to: range.to,
        limit: 1,
        orderBy: 'count',
      });
      const first = report.data.services[0];
      return first ? { name: first.name, count: first.count } : null;
    }, 'topService');

    const occupancyPct = await this.safe(
      async () =>
        (
          await this.employeesService.getReport({
            from: range.from,
            to: range.to,
          })
        ).data.occupancyPct,
      'occupancyPct',
    );

    return {
      revenue: revenueReport.data.total,
      paymentsCount: revenueReport.data.paymentsCount,
      averageTicket: revenueReport.data.averageTicket,
      appointmentsTotal: appointmentsReport.data.total,
      completionRatePct: appointmentsReport.data.completionRatePct ?? 0,
      cancellationRatePct: appointmentsReport.data.cancellationRatePct ?? 0,
      newCustomers,
      topService,
      occupancyPct,
    };
  }

  private async safe<T>(
    fn: () => Promise<T>,
    label: string,
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.logger.error(
        `summary optional "${label}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { AppointmentsReportRepository } from '../repositories/appointments.repository';
import { ReportsCacheService } from '../cache/reports-cache.service';
import { resolveRange, type DateRange } from '../helpers/date-range.helper';
import { buildMeta } from '../helpers/meta.helper';
import { buildBuckets, fillSeries } from '../helpers/time-series.helper';
import { pct } from '../helpers/money.helper';
import { runReport } from '../helpers/run-report.helper';
import type { ReportRangeDto } from '../dto/report-range.dto';
import type { TimeSeriesQueryDto } from '../dto/time-series-query.dto';
import type {
  AppointmentsDataDto,
  AppointmentsResponseDto,
  HeatmapBusiestSlotDto,
  HeatmapResponseDto,
} from '../types/report-response.type';

@Injectable()
export class AppointmentsReportService {
  private readonly logger = new Logger(AppointmentsReportService.name);

  constructor(
    private readonly repo: AppointmentsReportRepository,
    private readonly cache: ReportsCacheService,
  ) {}

  async getReport(dto: TimeSeriesQueryDto): Promise<AppointmentsResponseDto> {
    const range = resolveRange(dto);
    const granularity = dto.granularity ?? 'day';

    return runReport(
      this.logger,
      this.cache,
      'appointments',
      range,
      { granularity },
      async () => {
        const [summary, seriesRows] = await Promise.all([
          this.repo.getSummary(range.fromUtc, range.toUtcExclusive),
          this.repo.getSeries(
            range.fromUtc,
            range.toUtcExclusive,
            granularity,
            range.tz,
          ),
        ]);

        const buckets = buildBuckets(
          range.from,
          range.to,
          granularity,
          range.tz,
        );
        const normalized = seriesRows.map((row) => ({
          date: row.bucket,
          total: row.total,
          completed: row.completed,
          cancelled: row.cancelled,
        }));
        const series = fillSeries(
          buckets,
          normalized,
          (row) => row.date,
          (date) => ({ date, total: 0, completed: 0, cancelled: 0 }),
        );

        const data: AppointmentsDataDto = {
          total: summary.total,
          byStatus: {
            PENDING: summary.pending,
            CONFIRMED: summary.confirmed,
            COMPLETED: summary.completed,
            CANCELLED: summary.cancelled,
          },
          completionRatePct: pct(summary.completed, summary.total),
          cancellationRatePct: pct(summary.cancelled, summary.total),
          extendedCount: summary.extended,
          series,
        };

        return { meta: buildMeta(range, { granularity }), data };
      },
    );
  }

  async getHeatmap(dto: ReportRangeDto): Promise<HeatmapResponseDto> {
    const range: DateRange = resolveRange(dto);

    return runReport(
      this.logger,
      this.cache,
      'appointments-heatmap',
      range,
      {},
      async () => {
        const rows = await this.repo.getHeatmap(
          range.fromUtc,
          range.toUtcExclusive,
          range.tz,
        );

        const matrix: number[][] = Array.from({ length: 7 }, () =>
          Array.from({ length: 24 }, () => 0),
        );
        let busiest: HeatmapBusiestSlotDto | null = null;

        for (const row of rows) {
          const weekdayIndex = row.weekday - 1; // 1..7 -> 0..6
          if (
            weekdayIndex >= 0 &&
            weekdayIndex < 7 &&
            row.hour >= 0 &&
            row.hour < 24
          ) {
            matrix[weekdayIndex]![row.hour] = row.count;
          }
          if (!busiest || row.count > busiest.count) {
            busiest = {
              weekday: row.weekday,
              hour: row.hour,
              count: row.count,
            };
          }
        }

        return {
          meta: buildMeta(range),
          data: { matrix, busiestSlot: busiest },
        };
      },
    );
  }
}

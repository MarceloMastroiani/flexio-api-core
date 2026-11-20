import { Injectable, Logger } from '@nestjs/common';
import { RevenueRepository } from '../repositories/revenue.repository';
import { ReportsCacheService } from '../cache/reports-cache.service';
import { resolveRange } from '../helpers/date-range.helper';
import { buildMeta } from '../helpers/meta.helper';
import { buildBuckets, fillSeries } from '../helpers/time-series.helper';
import { pct, round2 } from '../helpers/money.helper';
import { runReport } from '../helpers/run-report.helper';
import type { TimeSeriesQueryDto } from '../dto/time-series-query.dto';
import type {
  RevenueDataDto,
  RevenueResponseDto,
} from '../types/report-response.type';

const METHODS = ['CASH', 'TRANSFER', 'CARD', 'MERCADOPAGO'] as const;

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(
    private readonly repo: RevenueRepository,
    private readonly cache: ReportsCacheService,
  ) {}

  async getRevenue(dto: TimeSeriesQueryDto): Promise<RevenueResponseDto> {
    const range = resolveRange(dto);
    const granularity = dto.granularity ?? 'day';

    return runReport(
      this.logger,
      this.cache,
      'revenue',
      range,
      { granularity },
      async () => {
        const [summary, byMethodRows, seriesRows] = await Promise.all([
          this.repo.getSummary(range.fromUtc, range.toUtcExclusive),
          this.repo.getByMethod(range.fromUtc, range.toUtcExclusive),
          this.repo.getSeries(
            range.fromUtc,
            range.toUtcExclusive,
            granularity,
            range.tz,
          ),
        ]);

        const byMethodMap = new Map(
          byMethodRows.map((row) => [row.method, row]),
        );
        const byMethod = METHODS.map((method) => {
          const row = byMethodMap.get(method);
          const total = row?.total ?? 0;
          return {
            method,
            total,
            count: row?.count ?? 0,
            sharePct: pct(total, summary.total),
          };
        });

        const buckets = buildBuckets(
          range.from,
          range.to,
          granularity,
          range.tz,
        );
        const normalized = seriesRows.map((row) => ({
          date: row.bucket,
          total: row.total,
          count: row.count,
        }));
        const series = fillSeries(
          buckets,
          normalized,
          (row) => row.date,
          (date) => ({ date, total: 0, count: 0 }),
        );

        const data: RevenueDataDto = {
          total: summary.total,
          paymentsCount: summary.count,
          averageTicket: summary.count
            ? round2(summary.total / summary.count)
            : 0,
          series,
          byMethod,
        };

        return { meta: buildMeta(range, { granularity }), data };
      },
    );
  }
}

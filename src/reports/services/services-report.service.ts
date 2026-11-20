import { Injectable, Logger } from '@nestjs/common';
import { ServicesReportRepository } from '../repositories/services-report.repository';
import { ReportsCacheService } from '../cache/reports-cache.service';
import { resolveRange } from '../helpers/date-range.helper';
import { buildMeta } from '../helpers/meta.helper';
import { pct } from '../helpers/money.helper';
import { runReport } from '../helpers/run-report.helper';
import type { TopQueryDto } from '../dto/top-query.dto';
import type {
  ServicesDataDto,
  ServicesResponseDto,
} from '../types/report-response.type';

@Injectable()
export class ServicesReportService {
  private readonly logger = new Logger(ServicesReportService.name);

  constructor(
    private readonly repo: ServicesReportRepository,
    private readonly cache: ReportsCacheService,
  ) {}

  async getTop(dto: TopQueryDto): Promise<ServicesResponseDto> {
    const range = resolveRange(dto);
    const limit = dto.limit ?? 10;
    const orderBy = dto.orderBy ?? 'count';

    return runReport(
      this.logger,
      this.cache,
      'services-top',
      range,
      { limit, orderBy },
      async () => {
        const [coverage, top] = await Promise.all([
          this.repo.getCoverage(range.fromUtc, range.toUtcExclusive),
          this.repo.getTopServices(
            range.fromUtc,
            range.toUtcExclusive,
            limit,
            orderBy,
          ),
        ]);

        const withServices = coverage.withServices;
        const services = top.map((row) => ({
          serviceId: row.serviceId,
          name: row.name,
          count: row.count,
          revenue: row.revenue,
          sharePct: pct(row.count, withServices),
        }));

        const data: ServicesDataDto = {
          completedAppointments: coverage.completed,
          appointmentsWithServices: withServices,
          appointmentsWithoutServices: coverage.completed - withServices,
          coveragePct: pct(withServices, coverage.completed),
          services,
        };

        return { meta: buildMeta(range), data };
      },
    );
  }
}

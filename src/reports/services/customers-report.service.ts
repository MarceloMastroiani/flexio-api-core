import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CustomersReportRepository } from '../repositories/customers-report.repository';
import { ReportsCacheService } from '../cache/reports-cache.service';
import { resolveRange } from '../helpers/date-range.helper';
import { buildMeta } from '../helpers/meta.helper';
import { runReport } from '../helpers/run-report.helper';
import { envs } from '../../common/configs/envs';
import type { TopQueryDto } from '../dto/top-query.dto';
import type { InactiveCustomersQueryDto } from '../dto/inactive-customers-query.dto';
import type {
  CustomersDataDto,
  CustomersResponseDto,
  InactiveCustomerItemDto,
  InactiveCustomersResponseDto,
} from '../types/report-response.type';

@Injectable()
export class CustomersReportService {
  private readonly logger = new Logger(CustomersReportService.name);

  constructor(
    private readonly repo: CustomersReportRepository,
    private readonly cache: ReportsCacheService,
  ) {}

  async getReport(dto: TopQueryDto): Promise<CustomersResponseDto> {
    const range = resolveRange(dto);
    const limit = dto.limit ?? 10;

    return runReport(
      this.logger,
      this.cache,
      'customers',
      range,
      { limit },
      async () => {
        const [counts, topBySpend, topByVisits] = await Promise.all([
          this.repo.getCounts(range.fromUtc, range.toUtcExclusive),
          this.repo.getTopBySpend(range.fromUtc, range.toUtcExclusive, limit),
          this.repo.getTopByVisits(range.fromUtc, range.toUtcExclusive, limit),
        ]);

        const data: CustomersDataDto = {
          activeCustomers: counts.activeCustomers,
          newCustomers: counts.newCustomers,
          returningCustomers: counts.returningCustomers,
          topBySpend,
          topByVisits,
        };

        return { meta: buildMeta(range), data };
      },
    );
  }

  async getInactive(
    dto: InactiveCustomersQueryDto,
  ): Promise<InactiveCustomersResponseDto> {
    const days = dto.days ?? 60;
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;

    const tz = envs.businessTimezone;
    const today = DateTime.now().setZone(tz).startOf('day');
    const cutoff = today.minus({ days });
    const cutoffUtc = cutoff.toUTC().toJSDate();

    const range = resolveRange({
      from: cutoff.toISODate()!,
      to: today.toISODate()!,
    });

    return runReport(
      this.logger,
      this.cache,
      'customers-inactive',
      range,
      { days, page, pageSize },
      async () => {
        const { items, total } = await this.repo.getInactive(
          cutoffUtc,
          pageSize,
          (page - 1) * pageSize,
        );

        const mapped: InactiveCustomerItemDto[] = items.map((row) => ({
          customerId: row.customerId,
          name: row.name,
          phone: row.phone,
          email: row.email,
          lastVisitAt: row.lastVisitAt ? row.lastVisitAt.toISOString() : null,
        }));

        return {
          meta: buildMeta(range),
          data: { items: mapped, page, pageSize, total },
        };
      },
    );
  }
}

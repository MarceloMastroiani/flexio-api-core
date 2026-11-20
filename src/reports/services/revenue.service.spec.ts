import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RevenueService } from './revenue.service';
import { RevenueRepository } from '../repositories/revenue.repository';
import { ReportsCacheService } from '../cache/reports-cache.service';

describe('RevenueService', () => {
  let service: RevenueService;

  const repo = {
    getSummary: vi.fn(),
    getByMethod: vi.fn(),
    getSeries: vi.fn(),
  };
  const cache = {
    buildKey: vi.fn(() => 'key'),
    getOrCompute: vi.fn(
      (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RevenueService,
        { provide: RevenueRepository, useValue: repo },
        { provide: ReportsCacheService, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(RevenueService);
  });

  it('incluye los 4 métodos con 0 si no hubo pagos', async () => {
    repo.getSummary.mockResolvedValue({ total: 0, count: 0 });
    repo.getByMethod.mockResolvedValue([]);
    repo.getSeries.mockResolvedValue([]);

    const res = await service.getRevenue({
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(res.data.paymentsCount).toBe(0);
    expect(res.data.averageTicket).toBe(0);
    expect(res.data.byMethod.map((m) => m.method)).toEqual([
      'CASH',
      'TRANSFER',
      'CARD',
      'MERCADOPAGO',
    ]);
    expect(res.data.byMethod.every((m) => m.total === 0)).toBe(true);
    expect(res.data.series).toHaveLength(31);
  });

  it('calcula averageTicket y sharePct', async () => {
    repo.getSummary.mockResolvedValue({ total: 1000, count: 4 });
    repo.getByMethod.mockResolvedValue([
      { method: 'CASH', total: 1000, count: 4 },
    ]);
    repo.getSeries.mockResolvedValue([
      { bucket: '2026-01-05', total: 1000, count: 4 },
    ]);

    const res = await service.getRevenue({
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(res.data.averageTicket).toBe(250);
    const cash = res.data.byMethod.find((m) => m.method === 'CASH');
    expect(cash?.sharePct).toBe(100);
    expect(res.data.series.find((p) => p.date === '2026-01-05')?.total).toBe(
      1000,
    );
  });
});

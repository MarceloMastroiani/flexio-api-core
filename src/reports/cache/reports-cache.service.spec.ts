import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsCacheService } from './reports-cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('ReportsCacheService', () => {
  let service: ReportsCacheService;

  const store = new Map<string, unknown>();
  const backend = {
    get: vi.fn((key: string) => store.get(key)),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return value;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    store.clear();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsCacheService,
        { provide: CACHE_MANAGER, useValue: backend },
      ],
    }).compile();

    service = moduleRef.get(ReportsCacheService);
  });

  it('cachea cuando cacheable=true', async () => {
    const fn = vi.fn().mockResolvedValue(123);

    const first = await service.getOrCompute('k', 300, fn, true);
    const second = await service.getOrCompute('k', 300, fn, true);

    expect(first).toBe(123);
    expect(second).toBe(123);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('no usa caché cuando cacheable=false (rangos que incluyen hoy)', async () => {
    const fn = vi.fn().mockResolvedValue(1);

    await service.getOrCompute('k', 300, fn, false);
    await service.getOrCompute('k', 300, fn, false);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(backend.get).not.toHaveBeenCalled();
  });

  it('arma keys estables e incluye el timezone', () => {
    const a = service.buildKey('revenue', { b: 2, a: 1, timezone: 'X' });
    const b = service.buildKey('revenue', { timezone: 'X', a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toContain('timezone=X');
  });
});

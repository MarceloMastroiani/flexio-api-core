import type { DateRange } from './date-range.helper';
import type { ReportMeta } from '../types/report-response.type';

export function buildMeta(
  range: DateRange,
  extras?: {
    granularity?: string;
    comparison?: { from: string; to: string };
  },
): ReportMeta {
  return {
    from: range.from,
    to: range.to,
    timezone: range.tz,
    ...(extras?.granularity ? { granularity: extras.granularity } : {}),
    generatedAt: new Date().toISOString(),
    ...(extras?.comparison ? { comparison: extras.comparison } : {}),
  };
}

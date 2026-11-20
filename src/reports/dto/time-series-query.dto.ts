import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ReportRangeDto } from './report-range.dto';

export const GRANULARITIES = ['day', 'week', 'month'] as const;
export type Granularity = (typeof GRANULARITIES)[number];

export const OUTPUT_FORMATS = ['json', 'csv'] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export class TimeSeriesQueryDto extends ReportRangeDto {
  @ApiPropertyOptional({ enum: GRANULARITIES, default: 'day' })
  @IsOptional()
  @IsIn(GRANULARITIES)
  granularity?: Granularity | undefined;

  @ApiPropertyOptional({ enum: OUTPUT_FORMATS, default: 'json' })
  @IsOptional()
  @IsIn(OUTPUT_FORMATS)
  format?: OutputFormat | undefined;
}

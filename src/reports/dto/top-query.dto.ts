import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ReportRangeDto } from './report-range.dto';

export const TOP_ORDER_BY = ['count', 'revenue'] as const;
export type TopOrderBy = (typeof TOP_ORDER_BY)[number];

export class TopQueryDto extends ReportRangeDto {
  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number | undefined;

  @ApiPropertyOptional({ enum: TOP_ORDER_BY, default: 'count' })
  @IsOptional()
  @IsIn(TOP_ORDER_BY)
  orderBy?: TopOrderBy | undefined;
}

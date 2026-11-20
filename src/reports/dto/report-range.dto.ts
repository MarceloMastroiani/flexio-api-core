import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class ReportRangeDto {
  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Fecha local inclusiva YYYY-MM-DD (default: hace 30 días)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string | undefined;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'Fecha local inclusiva YYYY-MM-DD (default: hoy)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string | undefined;
}

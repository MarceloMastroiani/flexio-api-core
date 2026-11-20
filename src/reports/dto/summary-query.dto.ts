import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReportRangeDto } from './report-range.dto';

export class SummaryQueryDto extends ReportRangeDto {
  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Comparar contra el período anterior de igual duración',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  compare?: boolean | undefined;
}

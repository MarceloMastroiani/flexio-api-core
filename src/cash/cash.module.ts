import { Module } from '@nestjs/common';
import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { CashRepository } from './cash.repository';

@Module({
  controllers: [CashController],
  providers: [CashService, CashRepository],
})
export class CashModule {}

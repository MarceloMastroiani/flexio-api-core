import { Module } from '@nestjs/common';
import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { CashRepository } from './cash.repository';
import { CustomersService } from '../customers/customers.service';

@Module({
  controllers: [CashController],
  providers: [CashService, CashRepository, CustomersService],
})
export class CashModule {}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CashService } from './cash.service';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post(":id")
  createPayments(@Param('id') id: string, @Body() createCashDto: CreateCashDto) {
    return this.cashService.createPayments(id, createCashDto);
  }

  @Get()
  findAllPayments() {
    return this.cashService.findAllPayments();
  }

  @Get('payments')
  dailyPayments(@Query("date") date: string) {
    return this.cashService.dailyPayments(date);
  }

  @Get(':id')
  findOnePayment(@Param('id') id: string) {
    return this.cashService.findById(id);
  }

  @Get('customer/:customerId')
  findPaymentsByCustomerId(@Param('customerId') customerId: string) {
    return this.cashService.findByCustomerId(customerId);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCashDto: UpdateCashDto) {
    return this.cashService.update(+id, updateCashDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cashService.remove(+id);
  }
}

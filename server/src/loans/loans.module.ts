import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PaymentScheduleService } from 'src/payment-schedule/payment-schedule.service';

@Module({
  controllers: [LoansController],
  providers: [LoansService, PaymentScheduleService],
})
export class LoansModule {}

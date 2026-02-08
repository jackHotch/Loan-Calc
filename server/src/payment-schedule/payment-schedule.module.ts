import { Module } from '@nestjs/common';
import { PaymentScheduleService } from './payment-schedule.service';

@Module({
  providers: [PaymentScheduleService],
  exports: [PaymentScheduleService],
})
export class PaymentScheduleModule {}

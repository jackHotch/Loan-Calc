import { Module } from '@nestjs/common';
import { PaymentScheduleService } from './payment-schedule.service';
import { PaymentScheduleController } from './payment-schedule.controller';

@Module({
  providers: [PaymentScheduleService],
  exports: [PaymentScheduleService],
  controllers: [PaymentScheduleController],
})
export class PaymentScheduleModule {}

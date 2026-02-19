import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PaymentScheduleModule } from 'src/payment-schedule/payment-schedule.module';

@Module({
  controllers: [LoansController],
  providers: [LoansService],
  imports: [PaymentScheduleModule],
})
export class LoansModule {}

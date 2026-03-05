import { Module } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';
import { PaymentScheduleModule } from 'src/payment-schedule/payment-schedule.module';
import { LoansModule } from 'src/loans/loans.module';

@Module({
  controllers: [SimulationsController],
  providers: [SimulationsService],
  imports: [PaymentScheduleModule, LoansModule],
})
export class SimulationsModule {}

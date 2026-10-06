import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { PaymentScheduleService } from './payment-schedule.service';
import { ApiKeyGuard } from 'src/auth/api-key.guard';

@Controller('payment-schedule')
@UseGuards(ApiKeyGuard)
export class PaymentScheduleController {
  constructor(
    private readonly paymentScheduleService: PaymentScheduleService,
  ) {}

  // Manual trigger for the daily cron job (see runDailyPaymentJob).
  @Patch()
  proccessPendingPaymentsForAllLoans() {
    return this.paymentScheduleService.runDailyPaymentJob();
  }

  @Patch('/:id')
  proccessPendingPaymentsForOneLoans(@Param('id') id: string) {
    return this.paymentScheduleService.processAllPendingPayments(BigInt(id));
  }
}

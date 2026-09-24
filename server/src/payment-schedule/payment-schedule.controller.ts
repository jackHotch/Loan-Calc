import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { PaymentScheduleService } from './payment-schedule.service';
import { ApiKeyGuard } from 'src/auth/api-key.guard';

@Controller('payment-schedule')
@UseGuards(ApiKeyGuard)
export class PaymentScheduleController {
  constructor(
    private readonly paymentScheduleService: PaymentScheduleService,
  ) {}

  // Daily cron. Promotion must happen before payments are marked actual, so a
  // row hardens with the promoted entry already in its inputs.
  @Patch()
  async proccessPendingPaymentsForAllLoans() {
    const promotedLoans =
      await this.paymentScheduleService.promoteDueSimulationEntries();
    await this.paymentScheduleService.processAllPendingPayments();
    return { promotedLoans };
  }

  @Patch('/:id')
  proccessPendingPaymentsForOneLoans(@Param('id') id: string) {
    return this.paymentScheduleService.processAllPendingPayments(BigInt(id));
  }
}

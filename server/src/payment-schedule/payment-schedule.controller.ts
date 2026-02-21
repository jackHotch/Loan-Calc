import { Controller, Param, Patch } from '@nestjs/common';
import { PaymentScheduleService } from './payment-schedule.service';

@Controller('payment-schedule')
export class PaymentScheduleController {
  constructor(
    private readonly paymentScheduleService: PaymentScheduleService,
  ) {}

  @Patch()
  proccessPendingPaymentsForAllLoans() {
    return this.paymentScheduleService.processAllPendingPayments();
  }

  @Patch('/:id')
  proccessPendingPaymentsForOneLoans(@Param('id') id: string) {
    return this.paymentScheduleService.processAllPendingPayments(+id);
  }
}

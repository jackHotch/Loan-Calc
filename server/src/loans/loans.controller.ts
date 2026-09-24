import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { SetExtraPaymentsDto } from './dto/set-extra-payments.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ApplyLumpSumDto } from './dto/apply-lump-sum.dto';
import { RecalibrateLoanDto } from './dto/recalibrate-loan.dto';
import { ClerkAuthGuard } from 'src/auth/clerk-auth.guard';
import { User } from 'src/auth/user.decorator';

@Controller('loans')
@UseGuards(ClerkAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(@User() userId: BigInt, @Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(userId, createLoanDto);
  }

  @Get()
  findAll(@User() userId: BigInt) {
    return this.loansService.findAll(userId);
  }

  @Get('/summary')
  summary(@User() userId: BigInt, @Body() body?: { loan_ids?: number[] }) {
    return this.loansService.getBaselineSummary(userId, body?.loan_ids);
  }

  @Get('/progress')
  getProgress(@User() userId: BigInt, @Body() body?: { loan_ids?: number[] }) {
    return this.loansService.getProgress(userId, body?.loan_ids);
  }

  @Get('/schedules')
  getSchedules(@User() userId: BigInt) {
    return this.loansService.getAllSchedules(userId);
  }

  @Get(':id/lump-sums')
  getLumpSums(@User() userId: BigInt, @Param('id') id: string) {
    return this.loansService.getLumpSums(userId, BigInt(id));
  }

  @Get(':id/extra-payments')
  getExtraPayments(@User() userId: BigInt, @Param('id') id: string) {
    return this.loansService.getExtraPayments(userId, BigInt(id));
  }

  // The whole timeline is replaced in one call, so correcting a mistake is an
  // edit of the list rather than a separate per-entry update route.
  @Put(':id/extra-payments')
  setExtraPayments(
    @User() userId: BigInt,
    @Param('id') id: string,
    @Body() dto: SetExtraPaymentsDto,
  ) {
    return this.loansService.setExtraPayments(
      userId,
      BigInt(id),
      dto.extra_payments,
    );
  }

  @Get(':id')
  findOne(@User() userId: BigInt, @Param('id') id: string) {
    return this.loansService.findOne(userId, BigInt(id));
  }

  @Patch(':id')
  update(
    @User() userId: BigInt,
    @Param('id') id: string,
    @Body() loanData: UpdateLoanDto,
  ) {
    return this.loansService.update(userId, BigInt(id), loanData);
  }

  @Patch(':id/recalibrate')
  recalibrate(
    @User() userId: BigInt,
    @Param('id') id: string,
    @Body() dto: RecalibrateLoanDto,
  ) {
    return this.loansService.recalibrate(userId, BigInt(id), dto);
  }

  @Patch(':id/lump-sum')
  applyLumpSum(
    @User() userId: BigInt,
    @Param('id') id: string,
    @Body() dto: ApplyLumpSumDto,
  ) {
    return this.loansService.applyLumpSum(userId, BigInt(id), dto);
  }

  @Delete(':id/lump-sums/:lumpSumId')
  deleteLumpSum(
    @User() userId: BigInt,
    @Param('id') id: string,
    @Param('lumpSumId') lumpSumId: string,
  ) {
    return this.loansService.deleteLumpSum(userId, BigInt(id), BigInt(lumpSumId));
  }

  @Delete(':id')
  remove(@User() userId: BigInt, @Param('id') id: string) {
    return this.loansService.remove(userId, BigInt(id));
  }
}

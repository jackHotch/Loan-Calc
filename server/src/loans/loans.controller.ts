import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ApplyLumpSumDto } from './dto/apply-lump-sum.dto';
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

  @Patch(':id/lump-sum')
  applyLumpSum(
    @User() userId: BigInt,
    @Param('id') id: string,
    @Body() dto: ApplyLumpSumDto,
  ) {
    return this.loansService.applyLumpSum(userId, BigInt(id), dto);
  }

  @Delete(':id')
  remove(@User() userId: BigInt, @Param('id') id: string) {
    return this.loansService.remove(userId, BigInt(id));
  }
}

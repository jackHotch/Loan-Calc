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

  @Post('/summary')
  summary(@User() userId: BigInt, @Body() body: { loan_ids: number[] }) {
    return this.loansService.getBaselineSummary(userId, body.loan_ids);
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

  @Delete(':id')
  remove(@User() userId: BigInt, @Param('id') id: string) {
    return this.loansService.remove(userId, BigInt(id));
  }
}

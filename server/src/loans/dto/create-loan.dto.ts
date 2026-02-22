import { IsString, IsNumber, IsOptional, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  lender?: string | null;

  @IsNumber()
  @Min(0)
  starting_principal: number;

  @IsNumber()
  interest_rate: number;

  @IsNumber()
  @Min(0)
  minimum_payment: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_payment?: number | null;

  @Type(() => Date)
  @IsDate()
  extra_payment_start_date: Date;

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @IsNumber()
  payment_day_of_month: number;
}

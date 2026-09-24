import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// A dated step in the loan's recurring extra payment. amount 0 means the extra
// payment stopped on that date.
export class ExtraPaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @Type(() => Date)
  @IsDate()
  start_date: Date;
}

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraPaymentDto)
  extra_payments?: ExtraPaymentDto[];

  @IsString()
  start_date: string;

  @IsNumber()
  payment_day_of_month: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accrued_interest?: number;
}

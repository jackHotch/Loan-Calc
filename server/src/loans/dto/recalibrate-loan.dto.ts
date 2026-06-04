import { IsNumber, IsOptional, Min } from 'class-validator';

export class RecalibrateLoanDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  current_principal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accrued_interest?: number;
}

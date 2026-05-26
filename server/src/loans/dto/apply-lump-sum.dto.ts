import { IsNumber, IsDateString, Min } from 'class-validator';

export class ApplyLumpSumDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  date: string;
}

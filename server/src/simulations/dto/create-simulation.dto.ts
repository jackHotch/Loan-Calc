import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  Min,
} from 'class-validator';

export enum StrategyType {
  AVALANCHE = 'Avalanche',
  SNOWBALL = 'Snowball',
  AVALANCHE_INTEREST_FOCUSED = 'Avalanche Interest Focused',
  SNOWBALL_INTEREST_FOCUSED = 'Snowball Interest Focused',
}

export class ExtraPaymentDto {
  amount: number;
  start_date: Date;
}

export class CreateSimulationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(StrategyType)
  strategy_type: StrategyType;

  @IsArray()
  extra_payments: ExtraPaymentDto[];

  @IsBoolean()
  cascade: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  loan_ids: BigInt[];
}

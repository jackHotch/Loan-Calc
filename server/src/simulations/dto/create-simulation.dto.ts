import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StrategyType {
  AVALANCHE = 'Avalanche',
  SNOWBALL = 'Snowball',
  AVALANCHE_INTEREST_FOCUSED = 'Avalanche Interest Focused',
  SNOWBALL_INTEREST_FOCUSED = 'Snowball Interest Focused',
}

export class ExtraPaymentDto {
  @IsNumber()
  amount!: number;

  @Type(() => Date)
  @IsDate()
  start_date!: Date;
}

export class LumpSumPaymentDto {
  @IsNumber()
  amount!: number;

  @Type(() => Date)
  @IsDate()
  date!: Date;
}

export class CreateSimulationDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(StrategyType)
  strategy_type!: StrategyType;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExtraPaymentDto)
  extra_payments!: ExtraPaymentDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LumpSumPaymentDto)
  lump_sum_payments!: LumpSumPaymentDto[];

  @IsBoolean()
  cascade!: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  loan_ids!: BigInt[];
}

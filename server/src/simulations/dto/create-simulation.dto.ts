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

export class CreateSimulationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(StrategyType)
  strategy_type: StrategyType;

  @IsNumber()
  @Min(0)
  extra_monthly_amount: number;

  @IsBoolean()
  cascade: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  loan_ids: number[];
}

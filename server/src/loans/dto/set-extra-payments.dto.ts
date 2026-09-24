import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExtraPaymentDto } from './create-loan.dto';

export class SetExtraPaymentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraPaymentDto)
  extra_payments: ExtraPaymentDto[];
}

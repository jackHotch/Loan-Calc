import { Module } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';

@Module({
  controllers: [SimulationsController],
  providers: [SimulationsService],
})
export class SimulationsModule {}

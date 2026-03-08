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
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { User } from 'src/auth/user.decorator';
import { ClerkAuthGuard } from 'src/auth/clerk-auth.guard';

@Controller('simulations')
@UseGuards(ClerkAuthGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post()
  create(@User() userId: BigInt, @Body() simulation: CreateSimulationDto) {
    return this.simulationsService.create(userId, simulation);
  }

  @Get()
  findAll() {
    return this.simulationsService.findAll();
  }

  @Get(':id')
  findOne(@User() userId: BigInt, @Param('id') id: string) {
    return this.simulationsService.findOne(userId, BigInt(id));
  }

  @Patch(':id')
  update(
    @User() userId: BigInt,
    @Param('id') simulationId: string,
    @Body() simulation: CreateSimulationDto,
  ) {
    return this.simulationsService.update(
      userId,
      BigInt(simulationId),
      simulation,
    );
  }

  @Get('/summary/:id')
  summary(@User() userId: BigInt, @Param('id') simulationId: string) {
    return this.simulationsService.getSimulationSummary(
      userId,
      BigInt(simulationId),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simulationsService.remove(+id);
  }
}

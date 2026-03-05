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
import { UpdateSimulationDto } from './dto/update-simulation.dto';
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
  findOne(@Param('id') id: string) {
    return this.simulationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSimulationDto: UpdateSimulationDto,
  ) {
    return this.simulationsService.update(+id, updateSimulationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simulationsService.remove(+id);
  }
}

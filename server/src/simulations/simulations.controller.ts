import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post()
  create(@Body() createSimulationDto: CreateSimulationDto) {
    return this.simulationsService.create(createSimulationDto);
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
  update(@Param('id') id: string, @Body() updateSimulationDto: UpdateSimulationDto) {
    return this.simulationsService.update(+id, updateSimulationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simulationsService.remove(+id);
  }
}

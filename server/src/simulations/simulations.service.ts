import { Injectable } from '@nestjs/common';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';

@Injectable()
export class SimulationsService {
  create(createSimulationDto: CreateSimulationDto) {
    return 'This action adds a new simulation';
  }

  findAll() {
    return `This action returns all simulations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} simulation`;
  }

  update(id: number, updateSimulationDto: UpdateSimulationDto) {
    return `This action updates a #${id} simulation`;
  }

  remove(id: number) {
    return `This action removes a #${id} simulation`;
  }
}

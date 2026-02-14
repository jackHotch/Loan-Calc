import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUser(@Body() data: { id: number }) {
    return this.usersService.getUser(data);
  }

  @Post()
  createUser(@Body() data) {
    return this.usersService.createUser(data);
  }

  @Put()
  updateUser(@Body() data) {
    return this.usersService.updateUser(data);
  }

  @Delete()
  deleteUser(@Body() data) {
    return this.usersService.deleteUser(data);
  }
}

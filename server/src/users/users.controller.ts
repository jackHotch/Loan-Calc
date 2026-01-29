import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor (private usersService: UsersService) {}

  @Post()
    createUser(@Body() data): any {
      return this.usersService.createUser(data);
    }
}

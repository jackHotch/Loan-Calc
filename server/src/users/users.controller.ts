import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/auth/user.decorator';
import { ClerkAuthGuard } from 'src/auth/clerk-auth.guard';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUser(@User() userId: BigInt) {
    return this.usersService.getUser(userId);
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

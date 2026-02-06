import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ClerkUserInterceptor implements NestInterceptor {
  constructor(private usersService: UsersService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    if (request.clerkUserId) {
      request.userId = await this.usersService.getInternalUserId(
        request.clerkUserId,
      );
    }
    return next.handle();
  }
}

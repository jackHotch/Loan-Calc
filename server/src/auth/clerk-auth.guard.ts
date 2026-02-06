import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.substring(7);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const session = await this.clerkClient.verifyToken(token);
    request.clerkUserId = session.sub;

    return true;
  }
}

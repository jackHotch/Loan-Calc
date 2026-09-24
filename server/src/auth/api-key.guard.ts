import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const expected = process.env.CRON_API_KEY;

    // Without this, an unset CRON_API_KEY makes the comparison
    // `undefined !== undefined`, which passes and leaves the route open to
    // anyone sending no header at all.
    if (!expected) {
      throw new UnauthorizedException('API key is not configured');
    }

    if (apiKey !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}

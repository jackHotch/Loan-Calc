import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { WebhookModule } from './webhook/webhook.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), ProfileModule, WebhookModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

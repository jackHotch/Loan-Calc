import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './webhook/webhook.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LoansModule } from './loans/loans.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClerkUserInterceptor } from './auth/clerk-user.interceptor';
import { PaymentScheduleModule } from './payment-schedule/payment-schedule.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WebhookModule,
    UsersModule,
    DatabaseModule,
    LoansModule,
    PaymentScheduleModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ClerkUserInterceptor },
  ],
})
export class AppModule {}

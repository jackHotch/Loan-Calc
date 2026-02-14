import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CLIENT_URL, // Replace with your frontend's actual domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Specify allowed methods
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ], // Specify allowed headers
    credentials: true, // Set to true if you use cookies or authentication headers
  });
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();

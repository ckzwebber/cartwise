import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

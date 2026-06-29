import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './common/configs/envs';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('mainFlexio');

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(envs.port);
  logger.log(`Server running on port ${envs.port}`);
}
bootstrap();

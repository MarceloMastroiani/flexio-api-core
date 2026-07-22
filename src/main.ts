import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './common/configs/envs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// NOTE: Este proyecto paso a ser core + vertical en uno. Cuando haya un segundo vertical se creará un nuevo core + vertical.

// INFO: Tarea pendiente en /appointments.controller.ts (primero crear Services y Employees)
// INFO: Tarea pendiente en /cash.controller.ts
// INFO: Tarea pendiente en /reports.controller.ts (Crear una vez este el de Appointments)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('mainFlexio');

  // ======== Swagger ========
  const config = new DocumentBuilder()
    .setTitle('Flexio API')
    .setDescription('The Flexio API description')
    .setVersion('1.0')
    .addTag('')
    .build();
  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('apiDoc', app, documentFactory);
  // =========================

  // Configuración de CORS
  app.enableCors({
    origin: envs.corsOrigin,
    credentials: true,
  });

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

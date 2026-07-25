import { NestFactory } from '@nestjs/core';
import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app: INestApplication = await NestFactory.create(AppModule);
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Experience API')
    .setDescription('Backend-for-frontend aggregating downstream domain services')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Experience API listening on port ${port}`);
  logger.log(`Swagger UI available at /docs`);
}

void bootstrap();

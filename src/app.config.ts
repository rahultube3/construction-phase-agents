import { INestApplication, ValidationPipe } from '@nestjs/common';

// Shared between main.ts and e2e tests so both run identical pipe config.
export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  return app;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as crypto from 'crypto';

// ✅ Polyfill for Node.js crypto
if (!global.crypto) {
  (global as any).crypto = {
    randomUUID: () => {
      return crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    },
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );
  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
}
bootstrap();

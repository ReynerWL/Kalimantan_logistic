import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { CorrelationIdMiddleware } from './utils/correlation-id.middleware';
import { Logger } from 'nestjs-pino';

// ✅ Polyfill for Node.js crypto if not available
if (!global.crypto) {
  (global as any).crypto = {
    randomUUID() {
      return crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    },
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const logger = app.get(Logger);
  const configService = app.get<ConfigService>(ConfigService);

  // 🔐 Security
  app.disable('x-powered-by');

  // 🔄 Middleware
  app.use(CorrelationIdMiddleware());
  app.useLogger(logger);

  // ✅ CORS: Allow all origins (with warning about credentials)
  app.enableCors({
    origin: '*', // 👍 Allows any frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // ❌ DO NOT set `credentials: true` when origin: '*'
  });

  // ✅ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // 📚 Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kalimantan Logistics API')
    .setDescription('Backend API for managing trips, delivery points, trucks, and users')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('trips', 'Trip management')
    .addTag('delivery-points', 'Delivery point CRUD')
    .addTag('trucks', 'Truck fleet management')
    .addTag('users', 'User & role management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Kalteng Logistic - API Docs',
  });

  // 🛰️ Start server
  const port = configService.get<number>('PORT', { infer: true }) || 3001;
  const hostname = '0.0.0.0';

  await app.listen(port, hostname, () => {
    logger.log(`🚀 Server is listening on http://${hostname}:${port}`);
    logger.log(`📘 Swagger docs: http://localhost:${port}/api/docs`);
  });

  app.enableShutdownHooks();
}

bootstrap();
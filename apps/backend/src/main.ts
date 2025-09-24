import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { CorrelationIdMiddleware } from './utils/correlation-id.middleware';
import { Logger } from 'nestjs-pino';

// ✅ Polyfill for Node.js crypto if not available
if (!global.crypto) {
  (global as any).crypto = {
    randomUUID: () => {
      return crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    },
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const logger = app.get(Logger);
  const configService = app.get<ConfigService>(ConfigService);

  // 🔐 Security & Headers
  app.disable('x-powered-by');

  // 🔄 Global Middleware
  app.use(CorrelationIdMiddleware());
  app.useLogger(logger);

  // ✅ CORS Configuration
  const frontendUrl = configService.get<string>('FRONTEND_URL', { infer: true }) || 'http://localhost:3000';
  const vercelApp = 'https://kalimantan-logistic-au4e.vercel.app';
  const devTunnel = 'https://5bdx1kx5-3000.asse.devtunnels.ms';

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ✅ Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false, // Set to true in production if needed
    }),
  );

  // 📚 Swagger API Docs
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Kalteng Logistic - API Docs',
  });

  // 🛰️ Listen on all interfaces
  const port = configService.get<number>('PORT', { infer: true }) || 3001;
  const hostname = '0.0.0.0'; // Bind to all network interfaces

  await app.listen(port, hostname, () => {
    logger.log(`🚀 Server is listening on http://${hostname}:${port}`);
    logger.log(`📘 Swagger docs: http://localhost:${port}/api/docs`);
  });

  // ⚡ Enable graceful shutdown hooks
  app.enableShutdownHooks();
}

bootstrap();
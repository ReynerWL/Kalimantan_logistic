import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Truck } from './entities/truck.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TrucksModule } from './trucks/trucks.module';
import { DeliveryPointsModule } from './delivery-points/delivery-points.module';
import { TripsModule } from './trips/trips.module';
import { SeedService } from './seed/seed.service';
import { DeliveryPoint } from './entities/delivery-point.entity';
import { Trip } from './entities/trip.entity';
import { LoggerModule } from 'nestjs-pino';

import * as crypto from 'crypto';
import { HealthController } from './health/health.controller';

// Apply before any TypeORM setup
if (!global.crypto) {
  (global as any).crypto = { randomUUID: () => crypto.randomBytes(16).toString('hex') };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.backend', '.env'],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProd = configService.get('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            level: configService.get('LOG_LEVEL', 'info'),
            ...(isProd
              ? {}
              : {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      translateTime: 'HH:MM:ss',
                      ignore: 'pid,hostname',
                    },
                  },
                }),
            customProps() {
              return {
                service: 'backend',
                env: process.env.NODE_ENV || 'local',
              };
            },
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        synchronize: true,
        autoLoadEntities: true,
        entities: [User, Truck, DeliveryPoint, Trip],
      }),
    }),
    // Needed so SeedService can inject User repository
    TypeOrmModule.forFeature([User]),
    AuthModule,
    UsersModule,
    TrucksModule,
    DeliveryPointsModule,
    TripsModule,
  ],
  controllers: [AppController,HealthController],
  providers: [AppService, SeedService],
})
export class AppModule {}

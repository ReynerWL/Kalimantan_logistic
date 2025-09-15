import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../entities/trip.entity';
import { User } from '../entities/user.entity';
import { Truck } from '../entities/truck.entity';
import { DeliveryPoint } from '../entities/delivery-point.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';


@Module({
  imports: [TypeOrmModule.forFeature([Trip, User, Truck, DeliveryPoint])],
  providers: [TripsService],
  controllers: [TripsController],
})
export class TripsModule {}



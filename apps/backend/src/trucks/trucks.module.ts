
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Truck } from '../entities/truck.entity';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';


@Module({
  imports: [TypeOrmModule.forFeature([Truck])],
  providers: [TrucksService],
  controllers: [TrucksController],
})
export class TrucksModule {}



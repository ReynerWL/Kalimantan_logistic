import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryPoint } from '../entities/delivery-point.entity';
import { DeliveryPointsService } from './delivery-points.service';
import { DeliveryPointsController } from './delivery-points.controller';


@Module({
  imports: [TypeOrmModule.forFeature([DeliveryPoint])],
  providers: [DeliveryPointsService],
  controllers: [DeliveryPointsController],
})
export class DeliveryPointsModule {}



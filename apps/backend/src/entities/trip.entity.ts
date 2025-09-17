import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Truck } from './truck.entity';
import { DeliveryPoint } from './delivery-point.entity';
import { User } from './user.entity';


@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tripDate: Date;

  @Column('double precision')
  distanceKm: number;

  @Column('double precision')
  durationHours: number;

  @Column('double precision')
  fuelUsedLiters: number;

  @Column('double precision') // IDR
  fuelCost: number;

  @Column('double precision')
  mealCost: number;

  @Column({ type: 'double precision', nullable: true })
  miscCost: number;

  @Column('double precision')
  totalCost: number;

  // Relations
  @ManyToOne(() => User, (driver:User) => driver.trips)
  driver: User;

  @ManyToOne(() => Truck, (truck:Truck) => truck.trips)
  truck: Truck;

  @ManyToOne(() => DeliveryPoint, (dp:DeliveryPoint) => dp.trips)
  destination: DeliveryPoint;
}
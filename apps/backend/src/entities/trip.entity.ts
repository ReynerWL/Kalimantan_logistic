import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Truck } from './truck.entity';
import { DeliveryPoint } from './delivery-point.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.trips, { eager: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @ManyToOne(() => Truck, (truck) => truck.trips, { eager: true })
  @JoinColumn({ name: 'truck_id' })
  truck: Truck;

  @ManyToOne(() => DeliveryPoint, (dp) => dp.trips, { eager: true })
  @JoinColumn({ name: 'destination_id' })
  destination: DeliveryPoint;

  @Column({ type: 'double precision', default: 0 })
  distanceKm: number; // round trip km

  @Column({ type: 'double precision', default: 0 })
  fuelUsedLiters: number;

  @Column({ type: 'double precision', default: 0 })
  fuelCost: number;

  @Column({ type: 'double precision', default: 0 })
  mealCost: number;

  @Column({ type: 'double precision', default: 0 })
  miscCost: number;

  @Column({ type: 'double precision', default: 0 })
  totalCost: number;

  @Column({ type: 'timestamptz', name: 'trip_date' })
  tripDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}



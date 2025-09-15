import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Trip } from './trip.entity';

@Entity('trucks')
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  model: string;

  @Column({ type: 'float', name: 'liter_per_km', nullable: true })
  literPerKm: number; // liters per kilometer

  @Column({ name: 'plate_number' , nullable: true})
  plateNumber: string;

  @Column({ nullable: true })
  color: string;

  @OneToMany(() => Trip, (trip: Trip) => trip.truck)
  trips: Trip[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}



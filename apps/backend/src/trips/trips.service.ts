import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../entities/trip.entity';
import { User } from '../entities/user.entity';
import { Truck } from '../entities/truck.entity';
import { DeliveryPoint } from '../entities/delivery-point.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(DeliveryPoint)
    private readonly dpRepo: Repository<DeliveryPoint>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.tripRepo.findAndCount({
      relations: {
        driver: true,
        truck: true,
        destination: true,
      },
      skip,
      take: limit,
      order: { tripDate: 'DESC' },
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllRaw() {
    return this.tripRepo.find({
      relations: {
        driver: true,
      },
    });
  }

  async findOne(id: string) {
    const item = await this.tripRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Trip not found');
    return item;
  }

  async create(data: Partial<Trip>) {
    const entity = this.tripRepo.create(data);
    return this.tripRepo.save(entity);
  }

  async update(id: string, data: Partial<Trip>) {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.tripRepo.save(item);
  }

  async remove(id: string) {
    await this.tripRepo.softDelete({ id });
    return { success: true };
  }

  // Basic route and cost estimation using haversine distance and simple rules
  async previewRouteCost(params: {
    hub: { lat: number; lng: number };
    destinationId: string;
    truckId: string;
    fuelPricePerLiter: number;
    startAt: Date;
  }) {
    const destination = await this.dpRepo.findOne({
      where: { id: params.destinationId },
    });
    if (!destination) throw new NotFoundException('Destination not found');
    const truck = await this.truckRepo.findOne({
      where: { id: params.truckId },
    });
    if (!truck) throw new NotFoundException('Truck not found');

    const oneWayKm = haversineKm(
      params.hub.lat,
      params.hub.lng,
      destination.latitude,
      destination.longitude,
    );
    const roundTripKm = oneWayKm * 2;
    const fuelUsed = roundTripKm * truck.literPerKm;
    const fuelCost = fuelUsed * params.fuelPricePerLiter;

    const avgSpeedKmH = 40; // conservative in-city + intercity
    const hours = roundTripKm / avgSpeedKmH;
    const mealCost = estimateMealCost(params.startAt, hours);
    const miscCost = 0;
    const totalCost = fuelCost + mealCost + miscCost;

    return {
      distanceKm: roundTripKm,
      durationHours: hours,
      fuelUsedLiters: fuelUsed,
      fuelCost,
      mealCost,
      miscCost,
      totalCost,
    };
  }
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateMealCost(startAt: Date, durationHours: number): number {
  const baseMeal = 20000; // IDR per meal
  const totalMeals = Math.max(1, Math.floor(durationHours / 6));
  return totalMeals * baseMeal;
}

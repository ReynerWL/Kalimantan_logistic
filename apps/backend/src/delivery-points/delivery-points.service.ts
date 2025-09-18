import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryPoint } from '../entities/delivery-point.entity';

@Injectable()
export class DeliveryPointsService {
  constructor(@InjectRepository(DeliveryPoint) private readonly repo: Repository<DeliveryPoint>) {}

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Delivery point not found');
    return item;
  }

  async create(data: Partial<DeliveryPoint>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<DeliveryPoint>) {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: string) {
    await this.repo.softDelete({ id });
    return { success: true };
  }

  async importFromJson(data: any[]) {
    const successful = [];
    const failed = [];
    const errors = [];

    for (const item of data) {
      try {
        // Validate required fields
        if (!item.nama || item.latitude === undefined || item.longitude === undefined) {
          throw new Error(`Missing required fields: nama, latitude, longitude`);
        }

        const point = this.repo.create({
          name: item.nama,
          address: item.alamat || null,
          latitude: parseFloat(item.latitude),
          longitude: parseFloat(item.longitude),
        });

        const saved = await this.repo.save(point);
        successful.push(saved);
      } catch (err) {
        failed.push(item);
        errors.push({
          item: item.nama || 'Unknown item',
          error: err.message,
        });
      }
    }

    return { successful, failed, errors };
  }
}



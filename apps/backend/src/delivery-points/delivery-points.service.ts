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
}



import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findAll() {
    return this.repo.find();
  }

  findAllDriver() {
    return this.repo.find({ where: { role: 'driver' } });
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('User not found');
    return item;
  }

  async create(data: Partial<User>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<User>) {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: string) {
    await this.repo.softDelete({ id });
    return { success: true };
  }
}



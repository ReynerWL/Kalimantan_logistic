import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async onModuleInit() {
    const existingAdmin = await this.userRepo.findOne({ where: { role: 'admin' } });
    if (existingAdmin) return;
    const email = 'admin@kltg.local';
    const name = 'Admin';
    const password = 'Admin123!';
    const user = this.userRepo.create({ email, name, password, role: 'admin' });
    await this.userRepo.save(user);
    this.logger.log(`Seeded default admin: ${email} / ${password}`);
  }
}



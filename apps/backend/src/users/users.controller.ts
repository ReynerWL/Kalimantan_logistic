import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsIn(['admin', 'driver'])
  role: 'admin' | 'driver';
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['admin', 'driver'])
  role?: 'admin' | 'driver';
}

// @UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('driver')
  findAllDriver() {
    return this.service.findAllDriver();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const items = await this.service.findAll();
    const data = items.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
    const csv = stringify(data, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    const text = file.buffer.toString('utf-8');
    type UserCsv = { name: string; email: string; password?: string; role: 'admin' | 'driver' };
    const records = parse<UserCsv>(text, { columns: true, skip_empty_lines: true });
    for (const r of records) {
      await this.service.create({ name: r.name, email: r.email, password: r.password || 'Password123', role: r.role });
    }
    return { success: true };
  }
}



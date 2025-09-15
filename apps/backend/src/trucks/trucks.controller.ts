import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { TrucksService } from './trucks.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { IsNumber, IsString } from 'class-validator';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { FileInterceptor } from '@nestjs/platform-express';

class CreateTruckDto {
  @IsString()
  model: string;

  @IsNumber()
  literPerKm: number;

  @IsString()
  plateNumber: string;

  @IsString()
  color: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('trucks')
export class TrucksController {
  constructor(private readonly service: TrucksService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTruckDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateTruckDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const items = await this.service.findAll();
    const data = items.map((t) => ({ id: t.id, model: t.model, plateNumber: t.plateNumber, color: t.color, literPerKm: t.literPerKm }));
    const csv = stringify(data, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="trucks.csv"');
    res.send(csv);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    const text = file.buffer.toString('utf-8');
    type TruckCsv = { model: string; plateNumber: string; color: string; literPerKm: string };
    const records = parse<TruckCsv>(text, { columns: true, skip_empty_lines: true });
    for (const r of records) {
      await this.service.create({ model: r.model, plateNumber: r.plateNumber, color: r.color, literPerKm: Number(r.literPerKm) });
    }
    return { success: true };
  }
}



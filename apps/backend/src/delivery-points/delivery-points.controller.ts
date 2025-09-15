import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { DeliveryPointsService } from './delivery-points.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { IsNumber, IsString } from 'class-validator';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { FileInterceptor } from '@nestjs/platform-express';

class CreateDeliveryPointDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('delivery-points')
export class DeliveryPointsController {
  constructor(private readonly service: DeliveryPointsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDeliveryPointDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateDeliveryPointDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const items = await this.service.findAll();
    const data = items.map((d) => ({ id: d.id, name: d.name, address: d.address, latitude: d.latitude, longitude: d.longitude }));
    const csv = stringify(data, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="delivery_points.csv"');
    res.send(csv);
  }

  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    const text = file.buffer.toString('utf-8');
    const records = parse<Record<string, string>>(text, { columns: true, skip_empty_lines: true });
    for (const r of records) {
      await this.service.create({ name: r.name, address: r.address, latitude: Number(r.latitude), longitude: Number(r.longitude) });
    }
    return { success: true };
  }
}



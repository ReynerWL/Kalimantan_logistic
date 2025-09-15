import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { TripsService } from './trips.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { FileInterceptor } from '@nestjs/platform-express';

class CreateTripDto {
  @IsString()
  driverId: string;

  @IsString()
  truckId: string;

  @IsString()
  destinationId: string;

  @IsDateString()
  tripDate: string;

  @IsOptional()
  @IsNumber()
  miscCost?: number;
}

@UseGuards(AuthGuard('jwt'))
@Controller('trips')
export class TripsController {
  constructor(private readonly service: TripsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post()
  async create(@Body() dto: CreateTripDto) {
    const preview = await this.service.previewRouteCost({
      hub: { lat: -2.2166, lng: 113.9166 },
      destinationId: dto.destinationId,
      truckId: dto.truckId,
      fuelPricePerLiter: 10000,
      startAt: new Date(dto.tripDate),
    });
    return this.service.create({
      driver: { id: dto.driverId } as any,
      truck: { id: dto.truckId } as any,
      destination: { id: dto.destinationId } as any,
      tripDate: new Date(dto.tripDate),
      distanceKm: preview.distanceKm,
      fuelUsedLiters: preview.fuelUsedLiters,
      fuelCost: preview.fuelCost,
      mealCost: preview.mealCost,
      miscCost: dto.miscCost ?? preview.miscCost,
      totalCost: preview.totalCost + (dto.miscCost ?? 0),
    });
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('preview/cost')
  preview(
    @Query('destinationId') destinationId: string,
    @Query('truckId') truckId: string,
    @Query('startAt') startAt: string,
    @Query('fuelPrice') fuelPrice: string,
  ) {
    return this.service.previewRouteCost({
      hub: { lat: -2.2166, lng: 113.9166 },
      destinationId,
      truckId,
      startAt: new Date(startAt),
      fuelPricePerLiter: Number(fuelPrice ?? 10000),
    });
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const items = await this.service.findAll();
    const data = items.map((t) => ({
      id: t.id,
      driver: t.driver?.name,
      truck: t.truck?.model,
      destination: t.destination?.name,
      tripDate: t.tripDate,
      distanceKm: t.distanceKm,
      fuelUsedLiters: t.fuelUsedLiters,
      fuelCost: t.fuelCost,
      mealCost: t.mealCost,
      miscCost: t.miscCost,
      totalCost: t.totalCost,
    }));
    const csv = stringify(data, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="trips.csv"');
    res.send(csv);
  }

  @Post('import/csv')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    const text = file.buffer.toString('utf-8');
    type TripCsv = {
      driverId: string;
      truckId: string;
      destinationId: string;
      tripDate: string;
      distanceKm?: string;
      fuelUsedLiters?: string;
      fuelCost?: string;
      mealCost?: string;
      miscCost?: string;
      totalCost?: string;
    };
    const records = parse<TripCsv>(text, { columns: true, skip_empty_lines: true });
    for (const r of records) {
      await this.service.create({
        driver: { id: r.driverId } as any,
        truck: { id: r.truckId } as any,
        destination: { id: r.destinationId } as any,
        tripDate: new Date(r.tripDate),
        distanceKm: Number(r.distanceKm || 0),
        fuelUsedLiters: Number(r.fuelUsedLiters || 0),
        fuelCost: Number(r.fuelCost || 0),
        mealCost: Number(r.mealCost || 0),
        miscCost: Number(r.miscCost || 0),
        totalCost: Number(r.totalCost || 0),
      });
    }
    return { success: true };
  }
}



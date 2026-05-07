import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AddressesService } from './addresses.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ForwardGeocodeDto, ReverseGeocodeDto } from './dto/geocode.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(
    private readonly addresses: AddressesService,
    private readonly geocoding: GeocodingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Save a new address for the current user' })
  create(@Req() req: Request, @Body() body: CreateAddressDto) {
    return this.addresses.create(req.user!.sub, body);
  }

  @Get()
  @ApiOperation({ summary: 'List the current user’s saved addresses' })
  list(@Req() req: Request) {
    return this.addresses.list(req.user!.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of the current user’s saved addresses' })
  getOne(@Req() req: Request, @Param('id') id: string) {
    return this.addresses.getOne(req.user!.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateAddressDto) {
    return this.addresses.update(req.user!.sub, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete an address' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.addresses.softDelete(req.user!.sub, id);
  }

  @Post('geocode/reverse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve lat/lng to an address (uses configured geocoding provider)' })
  reverseGeocode(@Body() body: ReverseGeocodeDto) {
    return this.geocoding.reverseGeocode(body.lat, body.lng);
  }

  @Post('geocode/forward')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search for addresses by free-text query (autocomplete)' })
  forwardGeocode(@Body() body: ForwardGeocodeDto) {
    return this.geocoding.forwardGeocode(body.query, body.city);
  }
}

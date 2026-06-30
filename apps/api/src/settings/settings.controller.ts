import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateDirectorSettingsDto } from './dto/update-director.dto';
import { UpdateHomePlansDto } from './dto/update-home-plans.dto';

@ApiTags('settings')
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public/settings/director')
  @ApiOperation({ summary: 'Active director channel + handle (public; clients use it to build the routing URL).' })
  async publicDirector() {
    return this.settings.getDirector();
  }

  @Get('admin/settings/director')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Admin: read current director routing settings.' })
  async adminGet() {
    return this.settings.getDirector();
  }

  @Patch('admin/settings/director')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Admin: toggle channel or update phone/username.' })
  async adminUpdate(@Body() dto: UpdateDirectorSettingsDto) {
    return this.settings.updateDirector(dto);
  }

  @Get('public/settings/home-plans')
  @ApiOperation({ summary: 'Home-screen quick-plan tiles (public; rendered in the mobile app).' })
  async publicHomePlans() {
    return this.settings.getHomePlans();
  }

  @Get('admin/settings/home-plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Admin: read home-screen quick-plan tiles.' })
  async adminGetHomePlans() {
    return this.settings.getHomePlans();
  }

  @Put('admin/settings/home-plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('manager', 'admin')
  @ApiOperation({ summary: 'Admin: replace the home-screen quick-plan tiles.' })
  async adminUpdateHomePlans(@Body() dto: UpdateHomePlansDto) {
    return this.settings.updateHomePlans(dto);
  }
}

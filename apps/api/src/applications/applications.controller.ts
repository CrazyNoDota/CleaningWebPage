import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { SubmitApplicationDto } from './dto/submit-application.dto';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a job application. One submission per phone per 24h.',
  })
  async submit(@Body() body: SubmitApplicationDto) {
    const a = await this.applications.submit(body);
    // Sanitized — no internal status / notes leak back to the public submitter.
    return {
      id: a.id,
      fullName: a.fullName,
      createdAt: a.createdAt,
    };
  }
}

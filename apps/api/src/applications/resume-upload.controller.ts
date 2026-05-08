import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { Request } from 'express';

@ApiTags('applications')
@Controller('applications/resume')
export class ResumeUploadController {
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Issue a one-time client upload token for a resume file. Used by @vercel/blob/client.upload from the browser.',
  })
  async upload(@Req() req: Request, @Body() body: HandleUploadBody) {
    return handleUpload({
      body,
      request: req as unknown as Request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
        ],
        maximumSizeInBytes: 5 * 1024 * 1024, // 5 MB
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // No-op: the client receives the URL and includes it in the application submit.
      },
    });
  }
}

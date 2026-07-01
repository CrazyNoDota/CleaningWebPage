import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * Catch-all exception filter.
 *
 * - Known Prisma request errors are mapped to sensible HTTP status codes.
 * - HttpExceptions are passed through unchanged (same body Nest would emit).
 * - Anything else is logged with its stack and returned as a generic 500,
 *   so a stray error never leaks internals or crashes the request pipeline.
 */
@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Let Nest's own HttpExceptions pass through unchanged.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response
        .status(status)
        .json(
          typeof body === 'string' ? { statusCode: status, message: body } : body,
        );
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrismaError(exception);
      if (mapped) {
        response.status(mapped.status).json({
          statusCode: mapped.status,
          error: HttpStatus[mapped.status],
          message: mapped.message,
          path: request.url,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      // Unmapped Prisma codes fall through to the generic 500 handler below,
      // preserving the pre-filter behaviour for those cases.
    }

    // Unexpected / non-HTTP errors: log with stack, return a generic 500.
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): { status: number; message: string } | null {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with these details already exists.',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found.',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The request references a related record that does not exist.',
        };
      default:
        return null;
    }
  }
}

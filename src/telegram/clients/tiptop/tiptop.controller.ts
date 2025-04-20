import {
  Controller,
  Post,
  Headers,
  Body,
  Res,
  HttpStatus,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { TipTopService } from './tiptop.service';

@Controller('api/tiptop/currency')
export class TipTopController implements OnModuleInit {
  private readonly apiKey = process.env.TIPTOP_WEBHOOK_KEY || 'your-secret-key';
  private readonly logger = new Logger(TipTopController.name);

  constructor(private readonly tiptopService: TipTopService) {}

  onModuleInit() {
    this.logger.log('\n📢 TipTop API Information:');
    this.logger.log('--------------------------------');
    this.logger.log('Endpoint: POST /api/tiptop/currency');
    this.logger.log('Required Headers:');
    this.logger.log('  X-Tiptop-Key: [your webhook key]');
    this.logger.log('Example Request Body:');
    this.logger.log('  {');
    this.logger.log('    "event": "currency_update"');
    this.logger.log('  }');
    this.logger.log('--------------------------------\n');
  }

  @Post()
  async handleWebhook(
    @Headers() headers: Record<string, string>,
    @Body() body: any,
    @Res() res: Response,
  ) {
    this.logger.log('Received API request with headers:', headers);
    this.logger.log('Request body:', body);

    // Проверяем API ключ из разных возможных заголовков
    const apiKey =
      headers['x-tiptop-key'] ||
      headers['X-Tiptop-Key'] ||
      headers['x-tiptop-key'.toLowerCase()] ||
      headers['x-api-key'] ||
      headers['X-Api-Key'];

    if (!apiKey) {
      this.logger.warn('No API key found in headers');
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied: No API key provided',
        headers: headers,
      });
    }

    if (apiKey !== this.apiKey) {
      this.logger.warn('Invalid API key provided');
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied: Invalid API key',
      });
    }

    // Проверяем тип события
    if (!body || !body.event) {
      this.logger.warn('No event type in request body');
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'No event type provided',
        receivedBody: body,
      });
    }

    if (body.event === 'currency_update') {
      try {
        this.logger.log('Publishing rates...');
        const result = await this.tiptopService.publishRates();
        this.logger.log('Rates published successfully:', result);
        return res.status(HttpStatus.OK).json({
          status: 'success',
          message: 'Rates published successfully',
          ...result,
        });
      } catch (error) {
        this.logger.error('Error publishing rates:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to publish rates',
          message: error.message,
        });
      }
    }

    this.logger.warn(`Unsupported event type: ${body.event}`);
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Unsupported event type',
      receivedEvent: body.event,
    });
  }
}

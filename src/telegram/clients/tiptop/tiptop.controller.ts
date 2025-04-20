import {
  Controller,
  Post,
  Headers,
  Body,
  Res,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { Response } from 'express';
import { TipTopService } from './tiptop.service';

@Controller('api/tiptop/currency')
export class TipTopController implements OnModuleInit {
  private readonly apiKey = process.env.TIPTOP_WEBHOOK_KEY || 'your-secret-key';

  constructor(private readonly tiptopService: TipTopService) {}

  onModuleInit() {
    console.log('\n📢 TipTop API Information:');
    console.log('--------------------------------');
    console.log('Endpoint: POST /api/tiptop/currency');
    console.log('Required Headers:');
    console.log('  X-Tiptop-Key: [your webhook key]');
    console.log('Example Request Body:');
    console.log('  {');
    console.log('    "event": "currency_update"');
    console.log('  }');
    console.log('--------------------------------\n');
  }

  @Post()
  async handleWebhook(
    @Headers('x-tiptop-key') apiKey: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    console.log('Received API request:', {
      body,
      hasApiKey: !!apiKey,
    });

    // Проверяем API ключ
    if (!apiKey || apiKey !== this.apiKey) {
      console.log('Access denied: Invalid API key');
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied: Invalid API key',
      });
    }

    // Проверяем тип события
    if (body.event === 'currency_update') {
      try {
        const result = await this.tiptopService.publishRates();
        return res.status(HttpStatus.OK).json({
          status: 'success',
          message: 'Rates published successfully',
          ...result,
        });
      } catch (error) {
        console.error('Error publishing rates:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to publish rates',
          message: error.message,
        });
      }
    }

    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Unsupported event type',
    });
  }
}

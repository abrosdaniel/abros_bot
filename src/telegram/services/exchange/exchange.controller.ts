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
import { ExchangeService } from './exchange.service';
import { ExchangeDBService } from '../../../database/services/exchange/exchange.service';

@Controller('api/exchange')
export class ExchangeController implements OnModuleInit {
  private readonly apiKey = process.env.EXCHANGE_WEBHOOK_KEY;

  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly exchangeDBService: ExchangeDBService,
  ) {}

  onModuleInit() {
    console.log('\n📢 Exchange API Information:');
    console.log('--------------------------------');
    console.log('Endpoint: POST /api/exchange');
    console.log('Required Headers:');
    console.log('  X-Exchange-Key: [your webhook key]');
    console.log('Example Request Body:');
    console.log('  {');
    console.log('    "event": "command"');
    console.log('  }');
    console.log('--------------------------------');
    console.log('Commands list:');
    console.log('currency_update - сообщить о изменениях курсов');
    console.log('--------------------------------\n');
  }

  @Post()
  async handleWebhook(
    @Headers('x-exchange-key') apiKey: string,
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
        // Сначала пересчитываем курсы
        const recalculateResult =
          await this.exchangeDBService.recalculateCurrencyRates();

        // Затем публикуем обновленные курсы
        const publishResult = await this.exchangeService.publishRates();

        return res.status(HttpStatus.OK).json({
          status: 'success',
          message: 'Rates updated and published successfully',
          recalculate: recalculateResult,
          publish: publishResult,
        });
      } catch (error) {
        console.error('Error processing currency update:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to process currency update',
          message: error.message,
        });
      }
    }

    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Unsupported event type',
    });
  }
}

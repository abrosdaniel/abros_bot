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

@Controller('webhook/tiptop')
export class TipTopController implements OnModuleInit {
  constructor(private readonly tiptopService: TipTopService) {}

  onModuleInit() {
    console.log('\n📢 TipTop Webhook Information:');
    console.log('--------------------------------');
    console.log('Endpoint: POST /webhook/tiptop');
    console.log('Allowed Host: bot.abros.dev');
    console.log('Example Request Body:');
    console.log('  {');
    console.log('    "event": "currency_update"');
    console.log('  }');
    console.log('--------------------------------\n');
  }

  @Post()
  async handleWebhook(
    @Headers('host') host: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    // Проверяем, что запрос пришел с разрешенного домена
    if (!host?.includes('bot.abros.dev')) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied',
      });
    }

    // Проверяем тип события
    if (body.event === 'currency_update') {
      try {
        await this.tiptopService.publishRates();
        return res.status(HttpStatus.OK).json({
          status: 'success',
          message: 'Rates published successfully',
        });
      } catch (error) {
        console.error('Error publishing rates:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to publish rates',
        });
      }
    }

    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Unsupported event type',
    });
  }
}

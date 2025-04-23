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
import { UserService } from '../../account/user.service';
import { NocoDBService } from '../../../database/nocodb.service';
import { Telegraf } from 'telegraf';

@Controller('api/exchange')
export class ExchangeController implements OnModuleInit {
  private readonly apiKey = process.env.EXCHANGE_WEBHOOK_KEY;
  private bot: Telegraf;

  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly exchangeDBService: ExchangeDBService,
    private readonly userService: UserService,
    private readonly nocodbService: NocoDBService,
  ) {}

  onModuleInit() {
    this.bot = this.exchangeService.getBot();
    if (!this.bot) {
      console.error('Bot instance is not initialized in ExchangeService');
    }

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
    console.log('Events list:');
    console.log('currency_update - сообщить о изменениях курсов');
    console.log('currency_error - сообщить об ошибке');
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

    if (!apiKey || apiKey !== this.apiKey) {
      console.log('Access denied: Invalid API key');
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Access denied: Invalid API key',
      });
    }

    if (body.event === 'currency_update') {
      try {
        const recalculateResult =
          await this.exchangeDBService.recalculateCurrencyRates();
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

    if (body.event === 'currency_error') {
      try {
        if (!this.bot) {
          console.error('Bot instance is not initialized');
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'Bot instance is not initialized',
          });
        }

        const users = await this.nocodbService.getAllUsers();
        const developers = users.filter((user) =>
          this.userService.isDeveloperUser(user.telegram_id),
        );
        const errorMessage = `⚠️ Ошибка в обменнике:\n\n${body.text}`;

        for (const developer of developers) {
          try {
            await this.bot.telegram.sendMessage(
              developer.telegram_id,
              errorMessage,
              {
                parse_mode: 'HTML',
              },
            );
          } catch (error) {
            console.error(
              `Failed to send error message to developer ${developer.telegram_id}:`,
              error,
            );
          }
        }

        return res.status(HttpStatus.OK).json({
          status: 'success',
          message: 'Error notification sent to developers',
        });
      } catch (error) {
        console.error('Error sending error notification:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to send error notification',
          message: error.message,
        });
      }
    }

    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Unsupported event type',
    });
  }
}

import { Module, OnModuleInit } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { NocoDBService } from '../database/nocodb.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountService } from './account.service';
import { AdminService } from './admin.service';
import { TipTopModule } from './clients/tiptop/tiptop.module';
import { TipTopService } from './clients/tiptop/tiptop.service';
import { TipTopDBModule } from '../database/clients/tiptop/tiptop-db.module';
import { session } from 'telegraf';
import { MyContext } from './types/context.types';
import { Telegraf } from 'telegraf';

@Module({
  imports: [
    ConfigModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
        middlewares: [
          session({
            defaultSession: () => ({}),
            getSessionKey: (ctx) => ctx.from?.id.toString(),
          }),
        ],
      }),
      inject: [ConfigService],
    }),
    TipTopModule,
    TipTopDBModule,
  ],
  providers: [
    TelegramService,
    NocoDBService,
    AccountService,
    AdminService,
    TipTopService,
  ],
  exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly tiptopService: TipTopService,
  ) {}

  onModuleInit() {
    // Получаем экземпляр бота из TelegramService
    const bot = this.telegramService.getBot();
    // Устанавливаем его в TipTopService
    this.tiptopService.setBotInstance(bot);
  }
}

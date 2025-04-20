import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { NocoDBService } from '../database/nocodb.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountService } from './account.service';
import { AdminService } from './admin.service';
import { TipTopModule } from './clients/tiptop/tiptop.module';
import { TipTopDBModule } from '../database/clients/tiptop/tiptop-db.module';
import { session } from 'telegraf';
import { MyContext } from './types/context.types';

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
  providers: [TelegramService, NocoDBService, AccountService, AdminService],
  exports: [TelegramService],
})
export class TelegramModule {}

import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramUpdate } from './telegram.update';
import { NocoDBService } from '../database/nocodb.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from './account/user.service';
import { AdminService } from './account/admin.service';
import { ExchangeModule } from './services/exchange/exchange.module';
import { ExchangeDBModule } from '../database/services/exchange/exchange.module';
import { session } from 'telegraf';

@Module({
  imports: [
    ConfigModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN'),
        middlewares: [
          session({
            defaultSession: () => ({}),
            getSessionKey: (ctx) => ctx.from?.id.toString(),
          }),
        ],
      }),
      inject: [ConfigService],
    }),
    ExchangeModule,
    ExchangeDBModule,
  ],
  providers: [TelegramUpdate, NocoDBService, UserService, AdminService],
  exports: [TelegramUpdate],
})
export class TelegramModule {}

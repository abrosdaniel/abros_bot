import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { NocoDBService } from '../../../database/nocodb.service';
import { ExchangeDBModule } from '../../../database/services/exchange/exchange.module';
import { ExchangeController } from './exchange.controller';

@Module({
  imports: [ExchangeDBModule],
  providers: [ExchangeService, NocoDBService],
  exports: [ExchangeService],
  controllers: [ExchangeController],
})
export class ExchangeModule {}

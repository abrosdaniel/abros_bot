import { Module } from '@nestjs/common';
import { ExchangeDBService } from './exchange.service';

@Module({
  providers: [ExchangeDBService],
  exports: [ExchangeDBService],
})
export class ExchangeDBModule {}

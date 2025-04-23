import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { NocoDBService } from '../../../database/nocodb.service';
import { ExchangeDBModule } from '../../../database/services/exchange/exchange.module';
import { ExchangeController } from './exchange.controller';
import { UserService } from '../../account/user.service';

@Module({
  imports: [ExchangeDBModule],
  providers: [ExchangeService, NocoDBService, UserService],
  exports: [ExchangeService],
  controllers: [ExchangeController],
})
export class ExchangeModule {}

import { Module } from '@nestjs/common';
import { TipTopService } from './tiptop.service';
import { NocoDBService } from '../../../database/nocodb.service';
import { TipTopDBModule } from '../../../database/clients/tiptop/tiptop-db.module';
import { TipTopController } from './tiptop.controller';

@Module({
  imports: [TipTopDBModule],
  providers: [TipTopService, NocoDBService],
  exports: [TipTopService],
  controllers: [TipTopController],
})
export class TipTopModule {}

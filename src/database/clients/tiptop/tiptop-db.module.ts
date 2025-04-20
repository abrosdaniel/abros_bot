import { Module } from '@nestjs/common';
import { TipTopDBService } from './tiptop-db.service';

@Module({
  providers: [TipTopDBService],
  exports: [TipTopDBService],
})
export class TipTopDBModule {}

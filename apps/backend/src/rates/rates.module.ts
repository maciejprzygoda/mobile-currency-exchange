import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RatesService } from './rates.service';
import { RatesController } from './rates.controller';

@Module({
  imports: [HttpModule],
  providers: [RatesService],
  controllers: [RatesController],
  exports: [RatesService],
})
export class RatesModule {}

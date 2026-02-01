import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { RatesModule } from '../rates/rates.module';

@Module({
  imports: [RatesModule], // żeby móc użyć RatesService (do dociągnięcia cache gdy brak)
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { RatesService } from './rates.service';

@Controller('rates')
export class RatesController {
  constructor(private rates: RatesService) { }

  // /rates/latest?table=A
  @Get('latest')
  latest(@Query('table') table?: string) {
    return this.rates.getLatestTable(table);
  }

  // /rates/date/2026-01-27?table=A
  @Get('date/:date')
  byDate(@Param('date') date: string, @Query('table') table?: string) {
    return this.rates.getTableByDate(date, table);
  }
  @Get('history/:code')
  async history(@Param('code') code: string, @Query('days') days?: string) {
    const n = Math.min(Math.max(Number(days || 3), 2), 30);
    return this.rates.getLastN(code, n);
  }

  // /rates/range?code=EUR&from=2026-01-01&to=2026-01-27&table=A
  @Get('range')
  range(
    @Query('code') code: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('table') table?: string,
  ) {
    return this.rates.getRange(code, from, to, table);
  }
}

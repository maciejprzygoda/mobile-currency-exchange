import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExchangeService } from './exchange.service';
import { ExchangeExecuteDto, ExchangeQuoteDto } from './dto/exchange.dto';

@Controller('exchange')
@UseGuards(JwtAuthGuard)
export class ExchangeController {
  constructor(private exchange: ExchangeService) {}

  @Post('quote')
  quote(@Body() dto: ExchangeQuoteDto) {
    return this.exchange.quote(dto);
  }

  @Post('execute')
  execute(@Req() req: any, @Body() dto: ExchangeExecuteDto) {
    return this.exchange.execute(req.user.userId, dto);
  }
}

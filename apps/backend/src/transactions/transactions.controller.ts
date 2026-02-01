import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private tx: TransactionsService) {}

  @Get()
  list(@Req() req: any, @Query('limit') limit?: string) {
    return this.tx.list(req.user.userId, limit ? Number(limit) : 50);
  }
}

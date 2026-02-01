import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get()
  getWallet(@Req() req: any) {
    return this.wallet.getWallet(req.user.userId);
  }

  @Post('topup')
  topUp(@Req() req: any, @Body('amount') amount: number) {
    return this.wallet.topUp(req.user.userId, Number(amount));
  }
}

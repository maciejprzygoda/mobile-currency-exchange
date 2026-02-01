import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        balances: true,
      },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return wallet;
  }

  async topUp(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const plnBalance = wallet.balances.find(b => b.currencyCode === 'PLN');

    if (!plnBalance) {
      throw new BadRequestException('PLN balance not found');
    }

    await this.prisma.$transaction([
      this.prisma.walletBalance.update({
        where: { id: plnBalance.id },
        data: {
          amount: {
            increment: amount,
          },
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          type: 'TOPUP',
          quoteCurrency: 'PLN',
          quoteAmount: amount,
        },
      }),
    ]);

    return { success: true };
  }
}

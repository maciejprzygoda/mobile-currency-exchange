import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RatesService } from '../rates/rates.service';

@Injectable()
export class SummaryService {
  constructor(
    private prisma: PrismaService,
    private rates: RatesService,
  ) {}

  private async getLatestRateFromCache(code: string) {
    const c = code.toUpperCase();

    // próbujemy z cache (tabela A)
    let rec = await this.prisma.rateCache.findFirst({
      where: { table: 'A', currencyCode: c },
      orderBy: { effectiveDate: 'desc' },
    });

    // jak nie ma, to wymusza pobranie latest z NBP i próbuje jeszcze raz
    if (!rec) {
      await this.rates.getLatestTable('A');
      rec = await this.prisma.rateCache.findFirst({
        where: { table: 'A', currencyCode: c },
        orderBy: { effectiveDate: 'desc' },
      });
    }

    if (!rec) throw new BadRequestException(`No rate for ${c}`);
    return rec;
  }

  async get(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { balances: true },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    let totalPln = new Prisma.Decimal('0');
    let ratesEffectiveDate: string | null = null;

    for (const b of wallet.balances) {
      const code = b.currencyCode.toUpperCase();
      const amount = new Prisma.Decimal(String(b.amount));

      if (code === 'PLN') {
        totalPln = totalPln.add(amount);
        continue;
      }

      const rateRec = await this.getLatestRateFromCache(code);
      const mid = new Prisma.Decimal(String(rateRec.rate));

      totalPln = totalPln.add(amount.mul(mid));

      // bierze najnowszą datę kursów do pokazania UI
      const d = rateRec.effectiveDate.toISOString().slice(0, 10);
      if (!ratesEffectiveDate || d > ratesEffectiveDate) ratesEffectiveDate = d;
    }

    return {
      balances: wallet.balances.map((b) => ({
        currencyCode: b.currencyCode,
        amount: b.amount,
      })),
      totalPln: totalPln.toFixed(2), //  2 miejsca po przezinku
      ratesEffectiveDate,
    };
  }
}

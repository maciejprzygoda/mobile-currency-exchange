import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RatesService } from '../rates/rates.service';
import { ExchangeQuoteDto } from './dto/exchange.dto';

@Injectable()
export class ExchangeService {
  constructor(
    private prisma: PrismaService,
    private rates: RatesService,
  ) { }

  private getSpread(): Prisma.Decimal {
    const raw = process.env.SPREAD ?? '0.01';
    const val = Number(raw);
    if (Number.isNaN(val) || val < 0 || val > 0.2) {
      // 0..20% – sanity check
      throw new Error('Invalid SPREAD in .env');
    }
    return new Prisma.Decimal(String(val));
  }

  private async ensureLatestRatesCached() {
    // odpala pobranie tabeli A i zapis do cache (jeśli już masz cache, to po prostu nadpisze/upsert)
    await this.rates.getLatestTable('A');
  }

  private async getLatestMidRate(code: string): Promise<{ rate: Prisma.Decimal; effectiveDate: Date }> {
    const c = code.toUpperCase();
    if (!/^[A-Z]{3}$/.test(c)) throw new BadRequestException('Invalid currency code (e.g. EUR).');

    // 1) spróbuj z cache
    let rec = await this.prisma.rateCache.findFirst({
      where: { table: 'A', currencyCode: c },
      orderBy: { effectiveDate: 'desc' },
    });

    // 2) jeśli brak, wymuś zaciągnięcie z NBP i spróbuj jeszcze raz
    if (!rec) {
      await this.ensureLatestRatesCached();
      rec = await this.prisma.rateCache.findFirst({
        where: { table: 'A', currencyCode: c },
        orderBy: { effectiveDate: 'desc' },
      });
    }

    if (!rec) throw new BadRequestException(`No rate for ${c} (NBP/cache).`);

    return {
      rate: new Prisma.Decimal(rec.rate.toString()),
      effectiveDate: rec.effectiveDate,
    };
  }

  private calcQuote(
    dto: ExchangeQuoteDto,
    mid: Prisma.Decimal,
    effectiveDate: Date,
  ) {
    const spread = this.getSpread();
    const type = dto.type;
    const code = dto.currencyCode.toUpperCase();

    const amount = new Prisma.Decimal(String(dto.amount));

    if (type === 'BUY') {
      // BUY: płacisz PLN, dostajesz X
      // kurs kupna = mid * (1 + spread)
      const rateBuy = mid.mul(new Prisma.Decimal('1').add(spread));
      const foreign = amount.div(rateBuy);

      return {
        type,
        currencyCode: code,
        effectiveDate,
        spread: spread.toString(),
        rate: this.round(rateBuy, 6),
        from: { currency: 'PLN', amount: this.fmtMoney('PLN', amount) },
        to: { currency: code, amount: this.fmtMoney(code, foreign) },
      };
    }

    // SELL: sprzedajesz X, dostajesz PLN
    // kurs sprzedaży = mid * (1 - spread)
    const rateSell = mid.mul(new Prisma.Decimal('1').sub(spread));
    const pln = amount.mul(rateSell);

    return {
      type,
      currencyCode: code,
      effectiveDate,
      spread: spread.toString(),
      rate: this.round(rateSell, 6),
      from: { currency: code, amount: this.fmtMoney(code, amount) },
      to: { currency: 'PLN', amount: this.fmtMoney('PLN', pln) },
    };
  }

  private round(d: Prisma.Decimal, decimals: number) {
    // Prisma.Decimal ma toFixed
    return d.toFixed(decimals);
  }

  private fmtMoney(currency: string, amount: Prisma.Decimal) {
    // PLN: 2 miejsca, FX: 6 (wystarczy do demo)
    const dec = currency === 'PLN' ? 2 : 6;
    return this.round(amount, dec);
  }

  async quote(dto: ExchangeQuoteDto) {
    if (dto.currencyCode.toUpperCase() === 'PLN') {
      throw new BadRequestException('currencyCode cannot be PLN');
    }

    const { rate: mid, effectiveDate } = await this.getLatestMidRate(dto.currencyCode);
    return this.calcQuote(dto, mid, effectiveDate);
  }

  async execute(userId: string, dto: ExchangeQuoteDto) {
    if (dto.currencyCode.toUpperCase() === 'PLN') {
      throw new BadRequestException('currencyCode cannot be PLN');
    }

    const { rate: mid, effectiveDate } = await this.getLatestMidRate(dto.currencyCode);
    const q = this.calcQuote(dto, mid, effectiveDate);
    const code = dto.currencyCode.toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        include: { balances: true },
      });
      if (!wallet) throw new BadRequestException('Wallet not found');

      const pln = wallet.balances.find(b => b.currencyCode === 'PLN');
      if (!pln) throw new BadRequestException('PLN balance missing');

      // zapewnij saldo dla waluty X (upsert)
      const fxBalance = await tx.walletBalance.upsert({
        where: {
          walletId_currencyCode: { walletId: wallet.id, currencyCode: code },
        },
        update: {},
        create: {
          walletId: wallet.id,
          currencyCode: code,
          amount: '0',
        },
      });

      if (dto.type === 'BUY') {
        const payPln = new Prisma.Decimal(q.from.amount); // PLN
        const getFx = new Prisma.Decimal(q.to.amount);    // X

        if (new Prisma.Decimal(pln.amount.toString()).lt(payPln)) {
          throw new BadRequestException('Insufficient PLN');
        }

        await tx.walletBalance.update({
          where: { id: pln.id },
          data: { amount: { decrement: payPln } },
        });

        await tx.walletBalance.update({
          where: { id: fxBalance.id },
          data: { amount: { increment: getFx } },
        });

        const tr = await tx.transaction.create({
          data: {
            userId,
            type: TransactionType.BUY,
            baseCurrency: code,
            quoteCurrency: 'PLN',
            baseAmount: getFx,
            quoteAmount: payPln,
            rate: new Prisma.Decimal(q.rate),
            spread: new Prisma.Decimal(q.spread),
            effectiveDate,
          },
        });

        return { executed: true, quote: q, transactionId: tr.id };
      }

      // SELL
      const sellFx = new Prisma.Decimal(q.from.amount); // X
      const getPln = new Prisma.Decimal(q.to.amount);   // PLN

      if (new Prisma.Decimal(fxBalance.amount.toString()).lt(sellFx)) {
        throw new BadRequestException(`Insufficient ${code}`);
      }

      await tx.walletBalance.update({
        where: { id: fxBalance.id },
        data: { amount: { decrement: sellFx } },
      });

      await tx.walletBalance.update({
        where: { id: pln.id },
        data: { amount: { increment: getPln } },
      });

      const tr = await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.SELL,
          baseCurrency: code,
          quoteCurrency: 'PLN',
          baseAmount: sellFx,
          quoteAmount: getPln,
          rate: new Prisma.Decimal(q.rate),
          spread: new Prisma.Decimal(q.spread),
          effectiveDate,
        },
      });

      return { executed: true, quote: q, transactionId: tr.id };
    });
  }
}

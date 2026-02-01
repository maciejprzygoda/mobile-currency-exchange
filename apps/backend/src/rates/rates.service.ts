import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

type TableType = 'A' | 'B' | 'C';

type NbpTableResponse = Array<{
  table: string;
  no: string;
  effectiveDate: string; // YYYY-MM-DD
  rates: Array<{
    currency: string;
    code: string;
    mid?: number;
    bid?: number;
    ask?: number;
  }>;
}>;

type NbpSingleCurrencyResponse = {
  table: string;
  currency: string;
  code: string;
  rates: Array<{
    no: string;
    effectiveDate: string;
    mid?: number;
    bid?: number;
    ask?: number;
  }>;
};

@Injectable()
export class RatesService {
  constructor(
    private http: HttpService,
    private prisma: PrismaService,
  ) {}

  private normalizeTable(table?: string): TableType {
    const t = (table || 'A').toUpperCase();
    if (t !== 'A' && t !== 'B' && t !== 'C') throw new BadRequestException('Invalid table. Use A, B or C.');
    return t;
  }

  private parseDate(date: string): Date {
    // oczekujemy YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    const d = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date.');
    return d;
  }

  private async fetchTableFromNbp(table: TableType, endpoint: string): Promise<NbpTableResponse> {
    // NBP: używam https://api.nbp.pl
    const url = `https://api.nbp.pl/api/exchangerates/tables/${table}/${endpoint}?format=json`;
    const res = await firstValueFrom(this.http.get(url, { timeout: 10_000 }));
    return res.data as NbpTableResponse;
  }

  async getLatestTable(table?: string) {
    const t = this.normalizeTable(table);

    // pobierz latest z NBP
    const data = await this.fetchTableFromNbp(t, '');
    const tableObj = data?.[0];
    if (!tableObj) throw new BadRequestException('NBP returned empty response');

    // zapisz w cache (upsert po table+code+effectiveDate)
    const effectiveDate = this.parseDate(tableObj.effectiveDate);
    await this.prisma.$transaction(
      tableObj.rates.map(r => {
        const rateValue = r.mid ?? r.ask ?? r.bid;
        if (rateValue == null) return this.prisma.rateCache.create({ data: { table: t, currencyCode: r.code, rate: '0', effectiveDate } }); // fallback (nie powinno się zdarzyć)
        return this.prisma.rateCache.upsert({
          where: {
            table_currencyCode_effectiveDate: {
              table: t,
              currencyCode: r.code,
              effectiveDate,
            },
          },
          update: { rate: String(rateValue) },
          create: {
            table: t,
            currencyCode: r.code,
            rate: String(rateValue),
            effectiveDate,
          },
        });
      }),
    );

    // zwraca ujednolicony format
    return {
      table: t,
      no: tableObj.no,
      effectiveDate: tableObj.effectiveDate,
      rates: tableObj.rates.map(r => ({
        currency: r.currency,
        code: r.code,
        mid: r.mid ?? null,
        bid: r.bid ?? null,
        ask: r.ask ?? null,
      })),
    };
  }

  async getTableByDate(date: string, table?: string) {
    const t = this.normalizeTable(table);
    const d = this.parseDate(date);

    // Najpierw z cache:
    const cached = await this.prisma.rateCache.findMany({
      where: { table: t, effectiveDate: d },
      orderBy: { currencyCode: 'asc' },
    });

    if (cached.length > 0) {
      return {
        table: t,
        effectiveDate: date,
        rates: cached.map(c => ({ code: c.currencyCode, rate: c.rate })),
        source: 'cache',
      };
    }

    // Jak nie ma w DB, bierzemy z NBP: /{table}/{date}
    const data = await this.fetchTableFromNbp(t, date);
    const tableObj = data?.[0];
    if (!tableObj) throw new BadRequestException('No data for this date (NBP)');

    const effectiveDate = this.parseDate(tableObj.effectiveDate);

    await this.prisma.$transaction(
      tableObj.rates.map(r => {
        const rateValue = r.mid ?? r.ask ?? r.bid;
        return this.prisma.rateCache.upsert({
          where: {
            table_currencyCode_effectiveDate: {
              table: t,
              currencyCode: r.code,
              effectiveDate,
            },
          },
          update: { rate: String(rateValue) },
          create: { table: t, currencyCode: r.code, rate: String(rateValue), effectiveDate },
        });
      }),
    );

    return {
      table: t,
      no: tableObj.no,
      effectiveDate: tableObj.effectiveDate,
      rates: tableObj.rates.map(r => ({
        currency: r.currency,
        code: r.code,
        mid: r.mid ?? null,
        bid: r.bid ?? null,
        ask: r.ask ?? null,
      })),
      source: 'nbp',
    };
  }

  async getRange(code: string, from: string, to: string, table?: string) {
    const t = this.normalizeTable(table);
    const c = String(code || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(c)) throw new BadRequestException('Invalid currency code (e.g. EUR).');

    const fromDate = this.parseDate(from);
    const toDate = this.parseDate(to);
    if (fromDate > toDate) throw new BadRequestException('from must be <= to');

    // NBP ma endpoint dla pojedynczej waluty: /exchangerates/rates/{table}/{code}/{startDate}/{endDate}/ :contentReference[oaicite:3]{index=3}
    const url = `https://api.nbp.pl/api/exchangerates/rates/${t}/${c}/${from}/${to}?format=json`;
    const res = await firstValueFrom(this.http.get(url, { timeout: 10_000 }));
    const data = res.data as NbpSingleCurrencyResponse;

    // Cache (po effectiveDate):
    await this.prisma.$transaction(
      data.rates.map(r => {
        const effectiveDate = this.parseDate(r.effectiveDate);
        const rateValue = r.mid ?? r.ask ?? r.bid;
        return this.prisma.rateCache.upsert({
          where: {
            table_currencyCode_effectiveDate: {
              table: t,
              currencyCode: c,
              effectiveDate,
            },
          },
          update: { rate: String(rateValue) },
          create: { table: t, currencyCode: c, rate: String(rateValue), effectiveDate },
        });
      }),
    );

    return {
      table: data.table,
      code: data.code,
      currency: data.currency,
      from,
      to,
      rates: data.rates.map(r => ({
        effectiveDate: r.effectiveDate,
        mid: r.mid ?? null,
        bid: r.bid ?? null,
        ask: r.ask ?? null,
      })),
    };
  }
  async getLastN(code: string, n: number) {
  const c = code.toUpperCase();
  const take = Math.min(Math.max(n, 2), 30);

  // NBP: tabela A
  const url = `https://api.nbp.pl/api/exchangerates/rates/A/${encodeURIComponent(c)}/last/${take}/?format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`NBP error (${res.status}): ${txt || 'cannot fetch history'}`);
  }

  const json: any = await res.json();

  return {
    currencyCode: c,
    points: (json.rates || []).map((r: any) => ({
      date: r.effectiveDate,
      value: String(r.mid),
    })),
  };
}

}

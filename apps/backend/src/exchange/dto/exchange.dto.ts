import { IsIn, IsNumber, IsPositive, IsString, Length } from 'class-validator';

export class ExchangeQuoteDto {
  // BUY = płacisz PLN i kupujesz walutę X
  // SELL = sprzedajesz walutę X i dostajesz PLN
  @IsIn(['BUY', 'SELL'])
  type: 'BUY' | 'SELL';

  @IsString()
  @Length(3, 3)
  currencyCode: string; // np. EUR, USD

  @IsNumber()
  @IsPositive()
  amount: number; // BUY: kwota w PLN, SELL: kwota w walucie X
}

export class ExchangeExecuteDto extends ExchangeQuoteDto {}

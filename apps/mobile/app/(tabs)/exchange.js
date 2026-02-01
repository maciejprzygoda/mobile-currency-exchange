import React, { useMemo, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { apiFetch } from '../../src/api/client';
import { formatAmount } from '../../src/ui/format';
import Screen from '../../src/ui/Screen';
import Card from '../../src/ui/Card';
import Input from '../../src/ui/Input';

export default function ExchangeScreen() {
  // typ transakcji: BUY /SELL
  const [type, setType] = useState('BUY');

  // kod waluty (NBP tabela A)
  const [currencyCode, setCurrencyCode] = useState('EUR');

  // BUY: amount jest w PLN, SELL: amount jest w walucie foreign
  const [amount, setAmount] = useState('100');

  // wynik z /exchange/quote albo /exchange/execute
  const [quote, setQuote] = useState(null);

  const cleanedCurrency = useMemo(() => currencyCode.trim().toUpperCase(), [currencyCode]);
  const cleanedType = useMemo(() => type.trim().toUpperCase(), [type]);

  const amountNumber = useMemo(() => {
    //  konwersja input ,/.
    const n = Number(String(amount).replace(',', '.'));
    return n;
  }, [amount]);

  async function doQuote() {
    try {
      // pobiera tylko symulację (bez zapisu do bazy)
      const q = await apiFetch('/exchange/quote', {
        method: 'POST',
        body: { type: cleanedType, currencyCode: cleanedCurrency, amount: amountNumber },
      });
      setQuote(q);
    } catch (e) {
      Alert.alert('Quote error', e.message);
    }
  }

  async function execute() {
    try {
      // transakcja (zapis do bazy i zmiana portfela)
      const res = await apiFetch('/exchange/execute', {
        method: 'POST',
        body: { type: cleanedType, currencyCode: cleanedCurrency, amount: amountNumber },
      });
      setQuote(res.quote);
      Alert.alert('OK', `Transaction: ${res.transactionId}`);
    } catch (e) {
      Alert.alert('Execute error', e.message);
    }
  }

  // proste przełączanie BUY/SELL 
  function toggleType() {
    setType((t) => (t === 'BUY' ? 'SELL' : 'BUY'));
    setQuote(null); 
  }

  // etykieta input zależna od typu
  const amountLabel = cleanedType === 'BUY'
    ? 'kwota w PLN (ile wydajesz)'
    : `kwota w ${cleanedCurrency} (ile sprzedajesz)`;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Wymiana</Text>

      <Card>
        <Text style={{ fontWeight: '700' }}>TRYB: ZAKUP/SPRZEDAŻ

        </Text>

        {/* BUY/SELL - przycisk do zmiany */}
        <View style={{ gap: 8 }}>
          <Text>aktualnie: {cleanedType}
            
          </Text>
          <Button title="przełącz ZAKUP / SPRZEDAŻ" onPress={toggleType} />
        </View>
      </Card>

      <Card>
        <Text style={{ fontWeight: '700' }}>waluta</Text>

        {/* kod waluty */}
        <Input
          value={cleanedCurrency}
          onChangeText={(c) => setCurrencyCode(c)}
          autoCapitalize="characters"
          placeholder="EUR"
        />

        <Text style={{ marginTop: 6, fontWeight: '700' }}>{amountLabel}</Text>

      
        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="100"
        />
      </Card>

      <Card>
      
        <Button title="PODLICZ (quote)" onPress={doQuote} />
        <View style={{ height: 8 }} />
        <Button title="WYKONAJ (execute)" onPress={execute} />
      </Card>

      {quote && (
        <Card>
          <Text style={{ fontWeight: '700' }}>podgląd wyliczenia</Text>

         
          <Text>rate: {String(quote.rate)}</Text>
          <Text>spread: {String(quote.spread)}</Text>

          {/* formatowanie kwoty, zaokrągllanie */}
          <Text>
            from: {quote.from.currency} {formatAmount(quote.from.currency, quote.from.amount)}
          </Text>
          <Text>
            to: {quote.to.currency} {formatAmount(quote.to.currency, quote.to.amount)}
          </Text>

         
          <Text style={{ marginTop: 6 }}>
            {cleanedType === 'BUY'
              ? 'buy: wydajesz PLN i dostajesz walutę'
              : 'sell: oddajesz walutę i dostajesz PLN'}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

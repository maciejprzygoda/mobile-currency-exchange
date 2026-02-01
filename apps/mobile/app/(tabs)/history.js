import React, { useEffect, useState } from 'react';
import { Text, Button, Alert, View } from 'react-native';
import { apiFetch } from '../../src/api/client';
import { formatAmount } from '../../src/ui/format';
import Screen from '../../src/ui/Screen';
import Card from '../../src/ui/Card';

export default function HistoryScreen() {
  // lista transakcji z backendu
  const [tx, setTx] = useState([]);

  //  pobranie historii
  async function load() {
    try {
      const data = await apiFetch('/transactions?limit=50');
      setTx(data);
    } catch (e) {
      Alert.alert('history error', e.message);
    }
  }

  useEffect(() => {
       load();
  }, []);

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Historia</Text>

      <Card>
        {/* odświeżenie listy */}
        <Button title="odśwież" onPress={load} />
        <Text style={{ marginTop: 8 }}>
          wpisów: {tx.length}
        </Text>
      </Card>

      {tx.length === 0 ? (
        <Card>
          <Text>brak transakcji (albo jeszcze się ładuje)</Text>
        </Card>
      ) : (
        tx.map((t) => {
          // prezentacja daty
          const when = new Date(t.createdAt).toLocaleString();


          const quoteLine =
            t.quoteCurrency && t.quoteAmount != null
              ? `quote: ${t.quoteCurrency} ${formatAmount(t.quoteCurrency, t.quoteAmount)}`
              : null;

          const baseLine =
            t.baseCurrency && t.baseAmount != null
              ? `base: ${t.baseCurrency} ${formatAmount(t.baseCurrency, t.baseAmount)}`
              : null;

          // sprawdzenie rate/spread 
          const rateLine =
            t.rate
              ? `rate: ${String(t.rate)} | spread: ${String(t.spread)}`
              : null;

          return (
            <Card key={t.id}>
              {/* nagłówek transakcji */}
              <Text style={{ fontWeight: '700' }}>
                {t.type} — {when}
              </Text>

              {/* kwoty */}
              {quoteLine ? <Text>{quoteLine}</Text> : null}
              {baseLine ? <Text>{baseLine}</Text> : null}

              {rateLine ? <Text>{rateLine}</Text> : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Text, Button, Alert, View, Pressable, Platform } from 'react-native';
import { apiFetch } from '../../src/api/client';
import Screen from '../../src/ui/Screen';
import Card from '../../src/ui/Card';
import Input from '../../src/ui/Input';
import MiniLineChart from '../../src/ui/MiniLineChart';

export default function RatesScreen() {
  // dane z /rates/latest
  const [data, setData] = useState(null);

  // filtr listy
  const [query, setQuery] = useState('');

  // wybrana waluta (klik z listy)
  const [selectedCode, setSelectedCode] = useState(null);

  // dane wykresu
  const [history, setHistory] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);

  async function loadLatest() {
    try {
      const r = await apiFetch('/rates/latest?table=A', { auth: false });
      setData(r);
    } catch (e) {
      Alert.alert('rates error', e.message);
    }
  }

  async function loadHistory(code) {
    try {
      setLoadingChart(true);
      setHistory(null);
      const h = await apiFetch(`/rates/history/${code}?days=7`, { auth: false });
      setHistory(h);
    } catch (e) {
      Alert.alert('chart error', e.message);
    } finally {
      setLoadingChart(false);
    }
  }

  useEffect(() => {
    loadLatest();
  }, []);

  const filteredRates = useMemo(() => {
    if (!data?.rates) return [];
    const q = query.trim().toUpperCase();
    if (!q) return data.rates;

    return data.rates.filter((r) => {
      const code = String(r.code).toUpperCase();
      const name = String(r.currency || '').toLowerCase();
      return code.includes(q) || name.includes(q.toLowerCase());
    });
  }, [data, query]);

  const chartValues = useMemo(
    () => (history?.points ? history.points.map((p) => Number(p.value)) : []),
    [history]
  );

  const chartLabels = useMemo(
    () => (history?.points ? history.points.map((p) => p.date) : []),
    [history]
  );

  const isWeb = Platform.OS === 'web';

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Kursy walut</Text>

      <Card>
        {/* góra: info + odśwież */}
        <Button title="odśwież kursy" onPress={loadLatest} />
        <Text style={{ marginTop: 6 }}>data: {data?.effectiveDate || '...'}</Text>
      </Card>

    
      <View
        style={{
          flexDirection: isWeb ? 'row' : 'column',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        {/* LEWA: lista + wyszukiwarka (na web przewijana) */}
        <View
          style={{
            flex: 1,
            width: '100%',

           
            ...(isWeb
              ? {
                  maxHeight: '70vh',
                  overflow: 'auto',
                }
              : null),
          }}
        >
          <Card>
            <Text style={{ fontWeight: '700' }}>lista kursów</Text>

            {/* wyszukiwarka */}
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="szukaj (np EUR, dolar)"
              autoCapitalize="characters"
            />

            <Text style={{ marginTop: 6 }}>wyników: {filteredRates.length}</Text>

            <View style={{ marginTop: 8 }}>
              {filteredRates.map((r) => {
                const value = r.mid ?? r.ask ?? r.bid;
                const code = String(r.code).toUpperCase();
                const active = code === selectedCode;

                return (
                  <Pressable
                    key={code}
                    onPress={() => {
                      setSelectedCode(code);
                      loadHistory(code);
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                      borderBottomWidth: 1,

                      // highlight wybranej waluty
                      backgroundColor: active ? '#eef2ff' : undefined,
                    }}
                  >
                    <Text style={{ fontWeight: '700' }}>
                      {code} — {String(value)}
                    </Text>
                    {r.currency ? <Text>{r.currency}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* PRAWA: wykres (na web sticky - zawsze widoczny) */}
        <View
          style={{
            flex: 1,
            width: '100%',
            ...(isWeb
              ? {
                  position: 'sticky',
                  top: 12,
                }
              : null),
          }}
        >
          <Card>
            <Text style={{ fontWeight: '700' }}>wykres (7 notowań)</Text>

            {!selectedCode ? (
              <Text>kliknij walutę z listy (wykres zostaje na ekranie)</Text>
            ) : loadingChart ? (
              <Text>ładuję dane dla {selectedCode}...</Text>
            ) : history?.points?.length ? (
              <View style={{ gap: 8 }}>
                <Text>waluta: {selectedCode}</Text>
                <MiniLineChart values={chartValues} labels={chartLabels} height={180} />
              </View>
            ) : (
              <Text>brak danych do wykresu</Text>
            )}
          </Card>
        </View>
      </View>
    </Screen>
  );
}

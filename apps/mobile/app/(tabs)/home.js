import React, { useEffect, useState } from 'react';
import { Text, Button, Alert, View } from 'react-native';
import { apiFetch } from '../../src/api/client';
import { clearToken } from '../../src/auth/authStore';
import { useRouter } from 'expo-router';
import { formatAmount } from '../../src/ui/format';
import Screen from '../../src/ui/Screen';
import Card from '../../src/ui/Card';
import Input from '../../src/ui/Input';

export default function HomeScreen() {
  const router = useRouter();

  // summary/dashboard: salda + wartość portfela w PLN
  const [summary, setSummary] = useState(null);

  // kwota do zasilenia (w PLN)
  const [amount, setAmount] = useState('100');

  // blokada żeby nie spamować zasilenia jak ktoś klika milion razy
  const [loadingTopup, setLoadingTopup] = useState(false);

  async function load() {
    try {
      // bierzemy dane z /summary
      const s = await apiFetch('/summary');
      setSummary(s);
    } catch (e) {
      Alert.alert('Summary error', e.message);
    }
  }

  async function topup() {
    //  walidacja po stronie UI 
    const n = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('info', 'podaj kwotę > 0');
      return;
    }

    setLoadingTopup(true);
    try {
      
      await apiFetch('/wallet/topup', { method: 'POST', body: { amount: n } });
      await load();
    } catch (e) {
      Alert.alert('Topup error', e.message);
    } finally {
      setLoadingTopup(false);
    }
  }

  async function logout() {
    await clearToken();
    router.replace('/');
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Portfel</Text>

      <Card>
        <Text style={{ fontWeight: '700' }}>WARTOŚĆ TWOJEGO PORTFELA</Text>
        <Text style={{ fontSize: 18 }}>
          {summary ? `${formatAmount('PLN', summary.totalPln)} PLN` : '...'}
        </Text>

        {/* data kursów  */}
        {summary?.ratesEffectiveDate ? (
          <Text>kursy z dnia: {summary.ratesEffectiveDate}</Text>
        ) : null}

        <View style={{ marginTop: 8 }}>
          <Button title="odśwież" onPress={load} />
        </View>
      </Card>

      <Card>
        <Text style={{ fontWeight: '700' }}>SALDA</Text>

        {!summary ? (
          <Text>ładowanie...</Text>
        ) : (
          summary.balances.map((b) => (
            <Text key={b.currencyCode} style={{ fontSize: 16 }}>
              {b.currencyCode}: {formatAmount(b.currencyCode, b.amount)}
            </Text>
          ))
        )}
      </Card>

      <Card>
        <Text style={{ fontWeight: '700' }}>Zasilanie konta, wprowadż kwotę zasilenia (PLN)</Text>

        {/* input z naszego ui, żeby wyglądało spójnie */}
        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="np 100"
        />

        <Button
          title={loadingTopup ? 'topup...' : 'ZASIL KONTO'}
          onPress={topup}
          disabled={loadingTopup}
        />
      </Card>

      <Card>
        {/* nawigacja po zakładkach */}
       {/* <Button title="kursy" onPress={() => router.push('/(tabs)/rates')} />
        <View style={{ height: 8 }} />
        <Button title="wymiana" onPress={() => router.push('/(tabs)/exchange')} />
        <View style={{ height: 8 }} />
        <Button title="historia" onPress={() => router.push('/(tabs)/history')} />
        <View style={{ height: 8 }} />
        */}
        <Button title="wyloguj" onPress={logout} />
      </Card>
    </Screen>
  );
}

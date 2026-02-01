import React, { useState } from 'react';
import { Text, Button, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import { saveToken } from '../src/auth/authStore';
import Screen from '../src/ui/Screen';
import Card from '../src/ui/Card';
import Input from '../src/ui/Input';

export default function Login() {
  const router = useRouter();

  // dane logowania (na start wpisane testowe)
  const [email, setEmail] = useState('test@test.pl');
  const [password, setPassword] = useState('haslo123');

  // blokuje przycisk na czas requestu
  const [loading, setLoading] = useState(false);

  async function login() {
    // prosta walidacja po stronie UI
    if (!email.trim() || !password) {
      Alert.alert('info', 'wpisz email i hasło');
      return;
    }

    setLoading(true);
    try {
      // logowanie  publiczne, token  w odpowiedzi
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: email.trim(), password },
      });

      // zapis JWT do AsyncStorage
      await saveToken(res.accessToken);

  
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert('login error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Logowanie</Text>

      <Card>
        {/* email */}
        <Text style={{ fontWeight: '700' }}>email</Text>
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="test@test.pl"
        />

        {/* hasło */}
        <Text style={{ fontWeight: '700', marginTop: 8 }}>hasło</Text>
        <Input
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="hasło"
        />

        <View style={{ marginTop: 12 }}>
          <Button
            title={loading ? 'logowanie...' : 'zaloguj'}
            onPress={login}
            disabled={loading}
          />
        </View>
      </Card>

      <Card>
        {/* przejście do rejestracji */}
        <Button title="utwórz konto" onPress={() => router.push('/register')} />
      </Card>
    </Screen>
  );
}

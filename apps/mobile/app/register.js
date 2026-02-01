import React, { useState } from 'react';
import { Text, Button, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import Screen from '../src/ui/Screen';
import Card from '../src/ui/Card';
import Input from '../src/ui/Input';

export default function Register() {
  const router = useRouter();

  // dane z formularza
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function register() {
    //  walidacja po stronie UI
    if (!email.trim() || !password) {
      Alert.alert('info', 'wpisz email i hasło');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        auth: false,
        body: { email: email.trim(), password },
      });

      Alert.alert('ok', 'konto utworzone, możesz się zalogować');
      router.back(); 
    } catch (e) {
      Alert.alert('error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Rejestracja</Text>

      <Card>
        {/* email */}
        <Text style={{ fontWeight: '700' }}>email</Text>
        <Input
          placeholder="np. test@test.pl"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* hasło */}
        <Text style={{ fontWeight: '700', marginTop: 8 }}>hasło</Text>
        <Input
          placeholder="min 6 znaków"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={{ marginTop: 12 }}>
          <Button
            title={loading ? 'tworzenie...' : 'utwórz konto'}
            onPress={register}
            disabled={loading}
          />
        </View>
      </Card>

      <Card>
      
        <Button title="wróć do logowania" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}

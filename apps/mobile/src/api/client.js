import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// WEB: backend na tym samym komputerze
// ANDROID emulator: 10.0.2.2
export const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';


async function getToken() {
  return AsyncStorage.getItem('token');
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && data.message && (Array.isArray(data.message) ? data.message.join(', ') : data.message)) ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

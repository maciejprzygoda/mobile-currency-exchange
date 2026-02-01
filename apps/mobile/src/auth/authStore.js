import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveToken(token) {
  await AsyncStorage.setItem('token', token);
}

export async function getToken() {
  return AsyncStorage.getItem('token');
}

export async function clearToken() {
  await AsyncStorage.removeItem('token');
}

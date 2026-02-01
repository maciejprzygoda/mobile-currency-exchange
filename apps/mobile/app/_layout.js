import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { getToken } from '../src/auth/authStore';

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    getToken().then((token) => {
      setIsAuthed(!!token);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <View style={styles.root}>
      {/* tło aplikacji */}
      <ImageBackground
        source={require('../assets/images/kantor_tlo.png')}
        style={StyleSheet.absoluteFillObject }
        resizeMode="cover"
      />

     
      <View pointerEvents="none" style={styles.tint} />

      <ThemeProvider value={TransparentTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          {!isAuthed ? (
            <>
              <Stack.Screen name="index" />
              <Stack.Screen name="register" />
            </>
          ) : (
            <Stack.Screen name="(tabs)" />
          )}
        </Stack>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%' },
  tint: {
    ...StyleSheet.absoluteFillObject,
    // przyciemnienie tla 
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
});

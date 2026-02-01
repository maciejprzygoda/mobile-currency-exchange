import React from 'react';
import { View } from 'react-native';

// card jako sekcja w panelu
export default function Card({ children, style }) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          gap: 8,
          backgroundColor: 'rgba(255,255,255,0.85)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

//  prosty wykres liniowy
export default function MiniLineChart({ values, labels, height = 120 }) {
  if (!values || values.length < 2) return <Text>brak danych do wykresu</Text>;

  const w = 520; 
  const h = height;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 10) - 5; 
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={{ gap: 6 }}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Polyline points={points} fill="none" strokeWidth="3" stroke="black" />
      </Svg>

      {labels?.length ? (
        <Text style={{ fontSize: 12 }}>
          {labels.join('  •  ')}
        </Text>
      ) : null}
    </View>
  );
}

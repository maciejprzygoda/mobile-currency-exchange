import React from 'react';
import { TextInput } from 'react-native';

// input z domyślnym wyglądem (żeby nie powtarzać stylów w każdym ekranie)
export default function Input(props) {
  return (
    <TextInput
      {...props}
      style={[
        {
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        props.style,
      ]}
    />
  );
}

'use client';

import 'client-only';

import { Text, View } from 'react-native';

export default function ClientOnlyImport() {
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'green',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>import client-only (Client Component)</Text>
    </View>
  );
}

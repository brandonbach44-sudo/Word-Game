// src/wordgrid/components/Grid.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Grid() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>[Grid Placeholder]</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 10 },
  placeholder: { color: '#888', fontSize: 16 },
});

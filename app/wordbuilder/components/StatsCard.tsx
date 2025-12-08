import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardProps {
  icon: string;
  value: string | number;
  label: string;
}

export const StatsCard = ({ icon, value, label }: StatsCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    marginBottom: 12,
    minHeight: 110,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ecca3',
    marginBottom: 4,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

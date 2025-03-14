// src/features/jogo/components/ManualTimeSelector.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ManualTimeSelector = ({ numPlayersPerTeam, setNumPlayersPerTeam }) => {
  const options = [2, 3, 4, 5, 6];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quantos jogadores por time?</Text>
      <View style={styles.buttonsRow}>
        {options.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.timeButton,
              numPlayersPerTeam === item && styles.timeButtonSelected,
            ]}
            onPress={() => setNumPlayersPerTeam(item)}
          >
            <Text
              style={[
                styles.timeButtonText,
                numPlayersPerTeam === item && styles.timeButtonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ManualTimeSelector;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 16,
  },
  title: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  timeButtonSelected: {
    backgroundColor: '#3B82F6',
    transform: [{ scale: 1.05 }],
  },
  timeButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeButtonTextSelected: {
    color: '#FFF',
  },
});

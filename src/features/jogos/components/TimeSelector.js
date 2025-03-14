// src/features/jogo/components/TimeSelector.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TimeSelector = ({
  tamanhoTime,
  setTamanhoTime,
  options = [2, 3, 4, 5, 6],
  totalJogadores,
  currentSetters,
  maxSetters,
}) => {
  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Quantos jogadores por time?</Text>

      {/* Botões para selecionar o tamanho */}
      <View style={styles.buttonsRow}>
        {options.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.timeButton,
              tamanhoTime === item && styles.timeButtonSelected,
            ]}
            onPress={() => setTamanhoTime(item)}
          >
            <Text
              style={[
                styles.timeButtonText,
                tamanhoTime === item && styles.timeButtonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Estatísticas: Jogadores e Levantadores */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>Jogadores</Text>
          <Text style={styles.statValue}>{totalJogadores}</Text>
        </View>

        <View style={styles.statPill}>
          <Text style={styles.statLabel}>Levantadores</Text>
          <Text style={styles.statValue}>
            {currentSetters}/{maxSetters}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default TimeSelector;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
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
    marginBottom: 12,
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

  // Estatísticas
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  statPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
});

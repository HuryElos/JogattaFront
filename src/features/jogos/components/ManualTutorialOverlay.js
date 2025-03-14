// src/features/jogo/components/ManualTutorialOverlay.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Popover from 'react-native-popover-view';

const ManualTutorialOverlay = () => {
  const [visible, setVisible] = useState(true);
  const steps = [
    '1) Escolha quantos jogadores por time no topo.',
    '2) Toque em “Time 1”, “Time 2”, etc., para alocar cada jogador.',
    '3) Remova um jogador do time se precisar.',
  ];

  const [stepIndex, setStepIndex] = useState(0);

  if (!visible || stepIndex >= steps.length) return null;

  return (
    <Popover
      isVisible={true}
      onRequestClose={() => setVisible(false)}
      backgroundStyle={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <View style={styles.tutorialContainer}>
        <Text style={styles.tutorialText}>{steps[stepIndex]}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setStepIndex(stepIndex + 1)}
        >
          <Text style={styles.buttonText}>
            {stepIndex < steps.length - 1 ? 'Próximo' : 'Fechar'}
          </Text>
        </TouchableOpacity>
      </View>
    </Popover>
  );
};

export default ManualTutorialOverlay;

const styles = StyleSheet.create({
  tutorialContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  tutorialText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

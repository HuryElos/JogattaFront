// /src/features/jogo/components/EquilibrarButton.js

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const EquilibrarButton = ({ onPress, disabled, mode }) => {
  let buttonText = 'Gerar Times';
  if (mode === 'levantadores') {
    buttonText = 'Gerar Times com Levantadores';
  } else if (mode === 'randomico') {
    buttonText = 'Gerar Times Aleatórios';
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{buttonText}</Text>
    </TouchableOpacity>
  );
};

export default EquilibrarButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

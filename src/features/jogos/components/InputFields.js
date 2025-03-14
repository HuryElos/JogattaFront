// jogos/components/InputField.js

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

/**
 * Componente reutilizável para campos de entrada.
 *
 * Props:
 * - label: Texto do label do campo.
 * - placeholder: Placeholder do TextInput.
 * - value: Valor do TextInput.
 * - onChangeText: Função chamada ao mudar o texto.
 * - multiline: Booleano indicando se o TextInput é multiline.
 * - keyboardType: Tipo de teclado para o TextInput.
 */
const InputField = ({ label, placeholder, value, onChangeText, multiline = false, keyboardType = 'default' }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  multiline: {
    textAlignVertical: 'top',
    height: 80,
  },
});

export default InputField;

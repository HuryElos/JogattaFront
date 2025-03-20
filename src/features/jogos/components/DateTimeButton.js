import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Botão reutilizável para exibir Data/Hora e abrir os modais.
 *
 * Props:
 * - label: Texto do label do botão.
 * - value: Valor exibido no botão.
 * - onPress: Função chamada ao pressionar o botão.
 * - icon: Nome do ícone do Ionicons (padrão "calendar-outline").
 */
const DateTimeButton = ({ label, value, onPress, icon = "calendar-outline" }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#666" style={styles.icon} />
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: {
    marginRight: 5,
  },
  text: {
    fontSize: 15,
    color: '#333',
  },
});

export default DateTimeButton;

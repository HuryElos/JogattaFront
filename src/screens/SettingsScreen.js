import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../contexts/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={() => {
          // Adicionar aqui lógica de navegação ou edição de perfil
          console.log('Editar Perfil');
        }}
      >
        <Ionicons name="person-outline" size={24} color="#4A90E2" />
        <Text style={styles.optionText}>Editar Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.option}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.optionText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  optionText: {
    marginLeft: 15,
    fontSize: 18,
    color: '#333',
  },
});

export default SettingsScreen;

// src/features/amigos/screens/AdicionarAmigos.js

// Descrição:
// Esta tela permite adicionar um novo amigo utilizando o componente `AdicionarAmigosComponent`.
// Fornece a interface visual para navegação e interação com o usuário.

// Relacionamentos:
// - Utiliza o componente `AdicionarAmigosComponent` para lógica de adicionar amigos.
// - Recebe a prop `navigation` para navegação entre telas.


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AdicionarAmigosComponent from '../../../components/AdicionarAmigosComponent';

const AdicionarAmigos = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Amigo</Text>
      <AdicionarAmigosComponent navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: 20,
  },
});

export default AdicionarAmigos;

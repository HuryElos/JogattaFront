// src/features/amigos/components/SearchBar.js

// Descrição:
// Este componente exibe uma barra de pesquisa com um ícone e um campo de entrada de texto.
// Permite que o usuário digite para realizar buscas em tempo real.

// Relacionamentos:
// - Usado na tela `ConvidarAmigos` para filtrar a lista de amigos ou grupos.
// - Recebe as props `value`, `onChangeText`, e `placeholder` para controle do valor e ações de filtragem.

// src/features/amigos/components/SearchBar.js

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, placeholder }) => (
  <View style={styles.searchContainer}>
    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
    />
  </View>
);

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    paddingRight: 10,
  },
  searchIcon: {
    marginLeft: 10,
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    paddingHorizontal: 0,
    color: '#333',
  },
});

export default SearchBar;

// src/features/amigos/components/AmigosList.js

// Descrição:
// Este componente exibe uma lista de amigos utilizando o `FlatList`.
// Suporta ações de refresh (pull-to-refresh) e exibe uma mensagem quando a lista está vazia.
// Utiliza o componente `AmigoItem` para renderizar cada amigo.

// Relacionamentos:
// - Usado na tela `ConvidarAmigos`.
// - Depende de `AmigoItem` para renderizar itens.
// - Recebe props como `amigos`, `selecionados`, `toggleSelecionado`, `onRefresh`, e `refreshing`.


import React from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import AmigoItem from './AmigoItem';

const AmigosList = ({
  amigos,
  selecionados,
  toggleSelecionado,
  onRefresh,
  refreshing,
}) => {
  return (
    <FlatList
      data={amigos}
      keyExtractor={(item) => String(item.id)}
      extraData={selecionados}
      renderItem={({ item }) => (
        <AmigoItem
          item={item}
          isSelected={selecionados.some((s) => s.tipo === 'amigo' && s.id === item.id)}
          onToggle={toggleSelecionado}
        />
      )}
      ListEmptyComponent={<Text style={styles.empty}>Nenhum amigo encontrado.</Text>}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }
      contentContainerStyle={amigos.length === 0 && styles.centerEmpty}
    />
  );
};

export default AmigosList;

const styles = StyleSheet.create({
  empty: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  centerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

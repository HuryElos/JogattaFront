// src/features/amigos/components/GrupoList.js

// Descrição:
// Este componente exibe uma lista de grupos utilizando o `FlatList`.
// Oferece a opção de excluir múltiplos grupos selecionados e suporta pull-to-refresh.
// Utiliza o componente `GrupoItem` para renderizar cada grupo.

// Relacionamentos:
// - Usado na tela `ConvidarAmigos`.
// - Depende de `GrupoItem` para renderizar itens.
// - Recebe props como `grupos`, `selecionados`, `toggleSelecionado`, `onEdit`, `onDelete`, `onRefresh`, e `onDeleteSelected`.


import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GrupoItem from './GrupoItem';

const GrupoList = ({
  grupos,
  selecionados,
  toggleSelecionado,
  onEdit,
  onDelete,
  onRefresh,
  refreshing,
  onDeleteSelected, // Nova prop para exclusão de grupos selecionados
}) => {
  return (
    <View style={styles.container}>
      {selecionados.filter((s) => s.tipo === 'grupo').length > 0 && (
        <TouchableOpacity style={styles.delAll} onPress={onDeleteSelected}>
          <Ionicons name="trash-bin" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.delAllText}>Excluir Grupos Selecionados</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={grupos}
        keyExtractor={(item) => String(item.id_grupo)}
        extraData={selecionados}
        renderItem={({ item }) => (
          <GrupoItem
            item={item}
            isSelected={selecionados.some((s) => s.tipo === 'grupo' && s.id === item.id_grupo)}
            onToggle={toggleSelecionado}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum grupo cadastrado.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />}
      />
    </View>
  );
};

export default GrupoList;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  delAll: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  delAllText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  empty: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 20 },
});

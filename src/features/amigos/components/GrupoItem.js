// src/features/amigos/components/GrupoItem.js

// Descrição:
// Este componente representa um item individual da lista de grupos.
// Exibe o nome do grupo, uma prévia de seus membros, e permite ações como editar, excluir ou selecionar o grupo.

// Relacionamentos:
// - Usado em `GrupoList` para renderizar cada grupo.
// - A função `onToggle` é usada para gerenciar a seleção do grupo.
// - As funções `onEdit` e `onDelete` são passadas como props para permitir edição e exclusão.


import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GrupoItem = React.memo(({ item, isSelected, onToggle, onEdit, onDelete }) => {
  const membrosResumo = item.membros.slice(0, 3).map(m => m.nome).join(', ');
  const maisMembros = item.membros.length > 3 ? ` e mais ${item.membros.length - 3} membros` : '';

  return (
    <TouchableOpacity
      style={[styles.item, isSelected && styles.itemSel]}
      onPress={() => onToggle('grupo', item.id_grupo)}
      activeOpacity={0.8}
    >
      <View style={styles.info}>
        <Ionicons name="people-circle-outline" size={50} color="#4CAF50" style={{ marginRight: 15 }} />
        <View style={{ maxWidth: '70%' }}>
          <Text style={styles.name} numberOfLines={1}>{item.nome_grupo}</Text>
          <Text style={styles.email} numberOfLines={1}>{membrosResumo}{maisMembros}</Text>
        </View>
      </View>
      <View style={styles.groupActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.btnIcon}>
          <Ionicons name="create-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id_grupo, item.nome_grupo)} style={styles.btnIcon}>
          <Ionicons name="trash-bin-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={isSelected ? '#4CAF50' : '#ccc'} />
      </View>
    </TouchableOpacity>
  );
});


export default GrupoItem;

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 15,
  },
  itemSel: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIcon: {
    marginLeft: 10,
  },
  email: {
    fontSize: 14,
    color: '#777',
  },
});

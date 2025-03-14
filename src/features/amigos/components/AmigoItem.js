// src/features/amigos/components/AmigoItem.js

// Descrição:
// Este componente representa um item individual da lista de amigos.
// Exibe as informações do amigo, como nome, avatar e e-mail, e permite seleção via clique.
// Indica se o amigo é temporário através de um selo.

// Relacionamentos:
// - Usado em `AmigosList` como renderizador para cada amigo na lista.
// - A função `onToggle` é passada como prop para gerenciar a seleção do amigo.


import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AmigoItem = React.memo(({ item, isSelected, onToggle }) => (
  <TouchableOpacity
    style={[styles.item, isSelected && styles.itemSel]}
    onPress={() => onToggle('amigo', item.id)}
    activeOpacity={0.8}
  >
    <View style={styles.info}>
      <Image
        source={{ uri: item.imagem_perfil || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={{ maxWidth: '75%' }}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.nome}</Text>
          {item.temporario && (
            <View style={styles.badgeTemp}>
              <Text style={styles.badgeTempText}>Temporário</Text>
            </View>
          )}
        </View>
        {item.email ? (
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        ) : (
          <Text style={styles.emailPlaceholder} numberOfLines={1}>(sem e-mail)</Text>
        )}
      </View>
    </View>
    <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={isSelected ? '#4CAF50' : '#ccc'} />
  </TouchableOpacity>
));
export default AmigoItem;

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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#EEE',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeTemp: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeTempText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  email: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  emailPlaceholder: {
    fontSize: 14,
    color: '#AAA',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

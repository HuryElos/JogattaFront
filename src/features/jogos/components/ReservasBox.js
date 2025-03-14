// src/features/jogo/components/ReservasBox.js

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import PlayerItem from './PlayerItem';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente para exibir jogadores na reserva.
 * Props:
 * - reservas: Array de jogadores em reserva.
 * - onMovePress: Função para mover jogadores (ou abrir revezamento).
 * - onPlayerPress: Função para abrir detalhes do jogador
 * - viewMode: Modo de visualização ('habilidades' ou 'nomes').
 */
const ReservasBox = ({ reservas, onMovePress, onPlayerPress, viewMode }) => {
  if (!Array.isArray(reservas)) {
    console.error('ReservasBox: reservas não é um array válido.', reservas);
    return <Text style={styles.errorText}>Erro ao carregar revezamentos.</Text>;
  }

  return (
    <View style={styles.reservasBox}>
      <Text style={styles.reservasTitle}>Revezamentos</Text>
      {reservas.length > 0 ? (
        <FlatList
          data={reservas}
          keyExtractor={(item, index) =>
            item.id_usuario?.toString() || `reserva-${index}`
          }
          renderItem={({ item }) => (
            <PlayerItem
              jogador={item}
              timeIndex={-1}
              onMovePress={onMovePress}
              viewMode={viewMode}
              onPlayerPress={onPlayerPress}
            />
          )}
          scrollEnabled={false} // Desabilita a rolagem interna
        />
      ) : (
        <View style={styles.reservasEmpty}>
          <Ionicons name="people-outline" size={36} color="#ccc" />
          <Text style={styles.reservaVazia}>Nenhum jogador em Revezamento.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  reservasBox: {
    marginTop: 12,
    backgroundColor: '#FFFBEA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFECB3',
    padding: 15,
  },
  reservasTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
    textAlign: 'center',
  },
  reservasEmpty: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  reservaVazia: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ReservasBox;

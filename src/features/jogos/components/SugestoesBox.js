// src/features/jogo/components/SugestoesBox.js

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const SugestoesBox = ({ rotacoes }) => {
  console.log('Rotacoes no SugestoesBox:', rotacoes); // Depuração

  // Caso não tenha sugestões
  if (!rotacoes || !rotacoes.length) {
    return (
      <Text style={styles.reservaVazia}>
        Nenhuma sugestão de substituição disponível.
      </Text>
    );
  }

  return (
    <View style={styles.sugestaoContainer}>
      <FlatList
        data={rotacoes}
        keyExtractor={(_, index) => `rot-${index}`}
        renderItem={({ item }) => (
          <View style={styles.sugestaoItem}>
            <Text style={styles.reservaTitle}>
              Reserva: {item.reserva?.nome || 'Desconhecido'}
            </Text>
            {item.sugeridos?.length > 0 ? (
              item.sugeridos.map((sug, i) => (
                <View key={i} style={styles.sugestaoDetalhe}>
                  <Text style={styles.sugLabel}>Time: {sug.time || 'N/A'}</Text>
                  <Text style={styles.sugLabel}>
                    Jogador: {sug.jogador?.nome || 'N/A'}
                  </Text>
                  <Text style={styles.sugLabel}>
                    Distância: {sug.distancia || 'N/A'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.sugLabel}>
                Nenhuma sugestão para esta reserva.
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sugestaoContainer: {
    backgroundColor: '#ECEFF1',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  sugestaoItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 6,
  },
  reservaTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sugestaoDetalhe: {
    marginBottom: 5,
    padding: 5,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  sugLabel: {
    fontSize: 13,
    color: '#333',
  },
  reservaVazia: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default SugestoesBox;

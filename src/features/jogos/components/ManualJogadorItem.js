// src/features/jogo/components/ManualJogadorItem.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ManualJogadorItem = ({ jogador, onAddToTeam, teamsCount }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{jogador.nome}</Text>
      <View style={styles.teamButtons}>
        {/* Cria um botão para cada time existente */}
        {[...Array(teamsCount).keys()].map((teamIndex) => (
          <TouchableOpacity
            key={teamIndex}
            style={styles.teamButton}
            onPress={() => onAddToTeam(jogador, teamIndex)}
          >
            <Text style={styles.teamButtonText}>Time {teamIndex + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ManualJogadorItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 4,
    padding: 8,
    borderRadius: 8,
    flexDirection: 'column',
    // sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  teamButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  teamButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  teamButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

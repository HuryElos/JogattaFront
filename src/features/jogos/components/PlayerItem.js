// src/features/jogo/components/PlayerItem.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Exibe um jogador na lista de Reservas ou no Modal de Habilidades, com botão "Mover".
 *
 * Props:
 * - jogador: objeto do jogador
 * - timeIndex: índice do time do jogador (-1 para reservas)
 * - onMovePress: função a ser chamada ao pressionar o botão "Mover"
 * - onPlayerPress: função a ser chamada ao pressionar o jogador
 * - viewMode: 'habilidades' | 'nomes'
 * - showMoveButton: boolean (exibir ou não o botão "Mover")
 */
const PlayerItem = ({
  jogador,
  timeIndex,
  onMovePress,
  onPlayerPress,
  viewMode,
  showMoveButton = true,
}) => {
  const handlePress = () => {
    if (onPlayerPress) onPlayerPress(jogador);
  };

  return (
    <View style={styles.playerContainer}>
      <TouchableOpacity
        style={styles.jogadorItem}
        onPress={handlePress}
        onLongPress={() => onMovePress(jogador, timeIndex)}
      >
        <Text style={styles.jogadorNome}>{jogador.nome}</Text>
        {viewMode === 'habilidades' && (
          <Text style={styles.score}>
            Passe: {jogador.passe} | Ataque: {jogador.ataque} | Levantamento: {jogador.levantamento}
          </Text>
        )}
      </TouchableOpacity>

      {showMoveButton && (
        <TouchableOpacity
          style={styles.moveButton}
          onPress={() => onMovePress(jogador, timeIndex)}
        >
          <Text style={styles.moveButtonText}>Mover</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PlayerItem;

const styles = StyleSheet.create({
  playerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  jogadorItem: {
    flex: 1,
    padding: 8,
    marginRight: 6,
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  jogadorNome: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  score: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  moveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  moveButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

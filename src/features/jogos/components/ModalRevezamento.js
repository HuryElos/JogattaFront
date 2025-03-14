// src/features/jogo/components/ModalRevezamento.js

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Modal para realizar revezamento de jogadores.
 *
 * Props:
 * - visible, onClose
 * - times
 * - reserva (quem está entrando pra revezar)
 * - rotacoes
 * - onConfirmRevezamento (timeIndex, jogadorAlvo)
 * - onUndoRevezamento (opcional)
 */
const ModalRevezamento = ({
  visible,
  onClose,
  times = [],
  reserva = null,
  rotacoes = [],
  onConfirmRevezamento,
  onUndoRevezamento,
}) => {
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);

  const fireThreshold = 1.5;

  if (!reserva) return null;

  const handleSelectTime = (timeIndex) => {
    const rotacaoAtual = rotacoes.find(
      (r) => r.reserva && r.reserva.id_usuario === reserva.id_usuario
    );
    let filtraSugestoes = [];
    if (rotacaoAtual) {
      filtraSugestoes = [...rotacaoAtual.sugeridos];
    }

    filtraSugestoes.sort((a, b) => Number(a.distancia) - Number(b.distancia));
    setSugestoes(filtraSugestoes);
    setSelectedTeamIndex(timeIndex);
  };

  const handleConfirm = (jogadorAlvo) => {
    if (selectedTeamIndex === null) {
      Alert.alert('Ops', 'Selecione um time primeiro.');
      return;
    }
    onConfirmRevezamento(selectedTeamIndex, jogadorAlvo);
  };

  const handleUndo = () => {
    if (onUndoRevezamento) onUndoRevezamento();
  };

  // Verifica se há revezamento
  const existingRevezamento = times.find((time) =>
    time.jogadores.some(
      (j) => j.revezandoCom && j.revezandoCom.id_usuario === reserva.id_usuario
    )
  );

  const getEmojiFor = (playerId) => {
    const indexSug = sugestoes.findIndex((s) => s.jogador.id_usuario === playerId);
    if (indexSug < 0) return '⚪';
    if (indexSug === 0) {
      const dist = parseFloat(sugestoes[0].distancia);
      return dist < fireThreshold ? '🔥' : '⭐';
    } else if (indexSug === 1) {
      return '⭐';
    } else {
      return '⚪';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Revezamento para {reserva.nome}</Text>

          <Text style={styles.subtitle}>1) Selecione um time:</Text>
          <FlatList
            data={times}
            horizontal
            keyExtractor={(_, i) => `time-${i}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  index === selectedTeamIndex && styles.timeButtonSelected,
                ]}
                onPress={() => handleSelectTime(index)}
              >
                <Ionicons name="people" size={16} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.timeButtonText}>{item.nomeTime}</Text>
              </TouchableOpacity>
            )}
            style={{ marginBottom: 10 }}
          />

          {selectedTeamIndex !== null && (
            <>
              <Text style={styles.subtitle}>2) Escolha um jogador para revezar:</Text>
              <FlatList
                data={times[selectedTeamIndex].jogadores || []}
                keyExtractor={(jg) => `player-${jg.id_usuario}`}
                renderItem={({ item }) => {
                  const emoji = getEmojiFor(item.id_usuario);
                  return (
                    <TouchableOpacity style={styles.jogadorItem} onPress={() => handleConfirm(item)}>
                      <Text style={styles.jogadorText}>
                        {emoji} {item.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                style={{ marginBottom: 10 }}
              />

              {existingRevezamento && (
                <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
                  <Ionicons name="arrow-undo-outline" size={20} color="#fff" />
                  <Text style={styles.undoButtonText}>Desfazer Revezamento</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalRevezamento;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  container: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#FF9800',
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  jogadorItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#EFEFEF',
    borderRadius: 6,
    marginBottom: 5,
  },
  jogadorText: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 6,
  },
  closeText: {
    fontSize: 16,
    color: '#333',
  },
  undoButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  undoButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
});

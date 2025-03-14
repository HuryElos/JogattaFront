// src/features/jogo/components/ModalMoverJogador.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ModalMoverJogador = ({ visible, onClose, times, onMovePlayer }) => {
  const data = [
    ...times.map((t, idx) => ({
      label: t.nomeTime || `Time ${idx + 1}`,
      value: idx,
    })),
    { label: 'Reservas', value: -1 },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Mover Jogador Para:</Text>
          <FlatList
            data={data}
            keyExtractor={(item, index) => `moveopt-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => onMovePlayer(item.value)}
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={18}
                  color="#007BFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.modalOptionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#FFF"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.modalCancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalMoverJogador;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalOptionText: {
    color: '#007BFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalCancelButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

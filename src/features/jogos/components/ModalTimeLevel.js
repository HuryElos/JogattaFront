// src/features/jogo/components/ModalTimeLevel.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ModalTimeLevel = ({ visible, onClose, time }) => {
  if (!visible) return null;

  if (!time) {
    return (
      <Modal visible={visible} transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Nenhum time selecionado</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const { nomeTime, averages } = time;
  const passe = averages?.passe ?? 0;
  const ataque = averages?.ataque ?? 0;
  const levantamento = averages?.levantamento ?? 0;

  const pPasse = (passe / 5) * 100;
  const pAtaque = (ataque / 5) * 100;
  const pLevantamento = (levantamento / 5) * 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Nível do {nomeTime}</Text>
            <TouchableOpacity onPress={onClose} style={styles.headerClose}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <View style={styles.iconContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100?text=Time' }}
              style={styles.icon}
            />
          </View>

          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>
              Passe: <Text style={styles.highlight}>{passe.toFixed(1)}</Text>
            </Text>
            <View style={styles.skillTrack}>
              <View style={[styles.skillFill, { width: `${pPasse}%` }]} />
            </View>
          </View>

          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>
              Ataque: <Text style={styles.highlight}>{ataque.toFixed(1)}</Text>
            </Text>
            <View style={styles.skillTrack}>
              <View style={[styles.skillFill, { width: `${pAtaque}%` }]} />
            </View>
          </View>

          <View style={styles.skillRow}>
            <Text style={styles.skillLabel}>
              Levant: <Text style={styles.highlight}>{levantamento.toFixed(1)}</Text>
            </Text>
            <View style={styles.skillTrack}>
              <View style={[styles.skillFill, { width: `${pLevantamento}%` }]} />
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalTimeLevel;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerClose: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
    color: '#333',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEE',
  },
  skillRow: {
    marginBottom: 15,
  },
  skillLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#444',
  },
  highlight: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  skillTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#FF9800',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

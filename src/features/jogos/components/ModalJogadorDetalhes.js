// src/features/jogo/components/ModalJogadorDetalhes.js

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

const ModalJogadorDetalhes = ({
  visible,
  jogador,
  onClose,
  toggleLevantador,
  onMovePress,
  onRevezarPress,
  onDesvincularPress, // Nova prop
}) => {
  if (!visible || !jogador) return null;

  // Se o jogador já estiver revezando com alguém
  const jaRevezando = !!jogador?.revezandoCom;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.playerName}>{jogador.nome}</Text>
            <TouchableOpacity onPress={onClose} style={styles.iconClose}>
              <Ionicons name="close-circle" size={28} color="#FF9800" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {jogador.foto ? (
                <Image source={{ uri: jogador.foto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={36} color="#FFF" />
                </View>
              )}
            </View>

            {/* Informações */}
            <Text style={styles.infoText}>
              <Ionicons name="man-outline" size={16} color="#FF9800" />{' '}
              Altura: {jogador.altura || '--'} cm
            </Text>

            {/* Habilidades */}
            <View style={styles.skillWrapper}>
              <Text style={styles.skillLabel}>Passe</Text>
              <View style={styles.skillTrack}>
                <View
                  style={[
                    styles.skillFill,
                    {
                      width: `${(jogador.passe / 5) * 100}%`,
                      backgroundColor: '#FF9800',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.skillWrapper}>
              <Text style={styles.skillLabel}>Ataque</Text>
              <View style={styles.skillTrack}>
                <View
                  style={[
                    styles.skillFill,
                    {
                      width: `${(jogador.ataque / 5) * 100}%`,
                      backgroundColor: '#4CAF50',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.skillWrapper}>
              <Text style={styles.skillLabel}>Levantamento</Text>
              <View style={styles.skillTrack}>
                <View
                  style={[
                    styles.skillFill,
                    {
                      width: `${(jogador.levantamento / 5) * 100}%`,
                      backgroundColor: '#2196F3',
                    },
                  ]}
                />
              </View>
            </View>

            {/* Switch Levantador */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Levantador:</Text>
              <Switch
                value={jogador.isLevantador}
                onValueChange={toggleLevantador}
                thumbColor={jogador.isLevantador ? '#FF9800' : '#ccc'}
                trackColor={{ false: '#767577', true: '#FFE0B2' }}
              />
            </View>
          </ScrollView>

          {/* Botões de ação */}
          <View style={styles.actionsRow}>
            {/* Botão "Mover" */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
              onPress={onMovePress}
            >
              <Ionicons name="swap-horizontal" size={20} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Mover</Text>
            </TouchableOpacity>

            {/* Botão "Revezar" */}
            {!jaRevezando && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                onPress={onRevezarPress}
              >
                <Ionicons name="refresh" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Revezar</Text>
              </TouchableOpacity>
            )}

            {/* Botão "Desvincular" */}
            {jaRevezando && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
                onPress={() => onDesvincularPress(jogador)} // **Atualizado para passar o jogador**
              >
                <Ionicons name="arrow-undo" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Desvincular</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Botão Fechar */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

ModalJogadorDetalhes.propTypes = {
  visible: PropTypes.bool.isRequired,
  jogador: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  toggleLevantador: PropTypes.func.isRequired,
  onMovePress: PropTypes.func.isRequired,
  onRevezarPress: PropTypes.func.isRequired,
  onDesvincularPress: PropTypes.func.isRequired, // Adicione esta prop
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9800',
  },
  iconClose: {
    padding: 4,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  skillWrapper: {
    width: '100%',
    marginBottom: 8,
  },
  skillLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    marginLeft: 2,
  },
  skillTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#DDD',
    borderRadius: 4,
  },
  skillFill: {
    height: '100%',
    borderRadius: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  switchLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#333',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    marginBottom: 10, // Adicionado para espaçamento em múltiplas linhas
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  closeBtn: {
    backgroundColor: '#777',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ModalJogadorDetalhes;

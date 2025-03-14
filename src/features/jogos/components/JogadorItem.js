import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * JogadorItem
 * 
 * @param {Object} props
 * @param {Object} props.jogador - Dados do jogador (nome, etc)
 * @param {Function} props.abrirModal - Função para abrir modal de habilidades
 * @param {Boolean} [props.isLevantador=false] - Indica se o jogador é levantador
 * @param {Function} [props.onToggleLevantador] - Handler para mudar isLevantador
 * @param {Object} [props.refEditButton] - Ref para o botão de editar habilidades
 * @param {Object} [props.refSwitch] - Ref para o switch de levantador
 * @param {Boolean} [props.limitError=false] - Se true, pinta o switch de vermelho
 */
const JogadorItem = ({
  jogador,
  abrirModal,
  isLevantador = false,
  onToggleLevantador = () => {},
  refEditButton,
  refSwitch,
  limitError = false,
}) => {
  return (
    <View style={[styles.jogadorItem, isLevantador && styles.jogadorItemSelected]}>
      <View style={styles.leftSection}>
        {isLevantador && (
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color="#4F46E5" />
            <Text style={styles.badgeText}>LEVANTADOR</Text>
          </View>
        )}
        <Text style={styles.jogadorNome}>{jogador.nome}</Text>
      </View>

      <View style={styles.actions}>
        {/* Botão para abrir o modal de habilidades */}
        <TouchableOpacity 
          onPress={() => abrirModal(jogador)}
          style={styles.editButton}
          ref={refEditButton}
        >
          <Ionicons 
            name="analytics" 
            size={24} 
            color="#4F46E5"
          />
        </TouchableOpacity>
        
        {/* Switch para marcar levantador 
            Se limitError for true, pinta a trilha do switch de vermelho */}
        <Switch
          value={isLevantador}
          onValueChange={onToggleLevantador}
          thumbColor="#FFFFFF"
          trackColor={{
            false: limitError ? '#F87171' : '#E5E7EB',
            true: '#A5B4FC',
          }}
          ios_backgroundColor="#E5E7EB"
          ref={refSwitch}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  jogadorItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // Sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  jogadorItemSelected: {
    // Se quiser destacar quando for levantador, pode usar por ex.:
    // backgroundColor: '#F9FAFB',
  },
  leftSection: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  badgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  jogadorNome: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: 16,
  },
});

export default JogadorItem;

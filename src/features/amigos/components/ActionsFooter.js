// src/features/amigos/components/ActionsFooter.js

import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActionsFooter = ({
  onNovoGrupo,
  onTemporario,
  onIniciarJogo,
  isDisabled,
}) => {
  const { width } = useWindowDimensions();

  // Define um breakpoint para telas pequenas
  const isSmallScreen = width < 350;

  if (isSmallScreen) {
    // **Opção 1: Scroll Horizontal**
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Botão NOVO GRUPO */}
          <TouchableOpacity
            style={styles.button}
            onPress={onNovoGrupo}
          >
            <Ionicons name="people-circle" size={18} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={styles.buttonText}>Novo Grupo</Text>
          </TouchableOpacity>

          {/* Botão CRIAR JOGADOR TEMPORÁRIO */}
          <TouchableOpacity style={styles.button} onPress={onTemporario}>
            <Ionicons name="person-add" size={18} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={styles.buttonText}>Temporário</Text>
          </TouchableOpacity>

          {/* Botão INICIAR JOGO */}
          <TouchableOpacity
            style={[styles.button, isDisabled && styles.disabledButton]}
            onPress={onIniciarJogo}
            disabled={isDisabled}
          >
            <Ionicons name="play" size={18} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={styles.buttonText}>Iniciar Jogo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // **Opção 2: Adaptação ao Tamanho da Tela**
  return (
    <View style={styles.containerResponsive}>
      {/* Botão NOVO GRUPO */}
      <TouchableOpacity
        style={styles.buttonResponsive}
        onPress={onNovoGrupo}
      >
        <Ionicons name="people-circle" size={18} color="#FFF" style={{ marginRight: 5 }} />
        <Text style={styles.buttonText}>Novo Grupo</Text>
      </TouchableOpacity>

      {/* Botão CRIAR JOGADOR TEMPORÁRIO */}
      <TouchableOpacity style={styles.buttonResponsive} onPress={onTemporario}>
        <Ionicons name="person-add" size={18} color="#FFF" style={{ marginRight: 5 }} />
        <Text style={styles.buttonText}>Temporário</Text>
      </TouchableOpacity>

      {/* Botão INICIAR JOGO */}
      <TouchableOpacity
        style={[styles.buttonResponsive, isDisabled && styles.disabledButton]}
        onPress={onIniciarJogo}
        disabled={isDisabled}
      >
        <Ionicons name="play" size={18} color="#FFF" style={{ marginRight: 5 }} />
        <Text style={styles.buttonText}>Iniciar Jogo</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionsFooter;

const styles = StyleSheet.create({
  // Estilos para a Opção 1: Scroll Horizontal
  container: {
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#EEE',
  },
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  // Estilos para a Opção 2: Adaptação ao Tamanho da Tela
  containerResponsive: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    justifyContent: 'space-between',
  },
  buttonResponsive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    justifyContent: 'center',
  },
  // Estilos Comuns
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
});

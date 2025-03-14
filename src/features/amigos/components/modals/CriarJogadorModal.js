// src/features/amigos/components/modals/CriarJogadorModal.js

import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const CriarJogadorModal = ({
  visible,
  onClose,
  onCreate,
  novoAmigoNome,
  setNovoAmigoNome,
  isCreating = false,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Criar Jogador Temporário</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do jogador"
            value={novoAmigoNome}
            onChangeText={setNovoAmigoNome}
          />

          <View style={styles.modalBtns}>
            <Button title="Cancelar" onPress={onClose} />
            <Button
              title={isCreating ? 'Criando...' : 'Criar'}
              onPress={onCreate}
              disabled={isCreating || !novoAmigoNome.trim()}
            />
          </View>

          {isCreating && (
            <ActivityIndicator
              size="small"
              color="#4CAF50"
              style={{ marginTop: 10 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CriarJogadorModal;

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    alignSelf: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    marginBottom: 15,
    fontSize: 16,
    padding: 5,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

import React from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native';

const CriarGrupoModal = ({ visible, onClose, onCreate, novoGrupo, setNovoGrupo }) => {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Criar Novo Grupo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do grupo"
            value={novoGrupo}
            onChangeText={setNovoGrupo}
          />
          <View style={styles.modalBtns}>
            <Button title="Cancelar" onPress={onClose} />
            <Button
              title="Criar"
              onPress={() => {
                console.log(`Criando grupo com o nome: ${novoGrupo}`);
                onCreate();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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

export default CriarGrupoModal;

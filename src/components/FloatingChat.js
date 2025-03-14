// src/components/FloatingChat.js

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FloatingChat = ({
  mensagens,
  enviarMensagem,
  novaMensagem,
  setNovaMensagem,
  idUsuario,
  loadingMensagens,
  onRefreshMensagens, // Adicionada a prop onRefreshMensagens
  refreshingMensagens, // Adicionada a prop refreshingMensagens
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const toggleModal = () => setModalVisible(!modalVisible);

  return (
    <View style={styles.container}>
      {/* Balão flutuante */}
      <TouchableOpacity style={styles.floatingButton} onPress={toggleModal}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal do chat */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat</Text>
              <TouchableOpacity onPress={toggleModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingMensagens && (
              <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 20 }} />
            )}

            {!loadingMensagens && mensagens.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma mensagem ainda.</Text>
            )}

            <FlatList
              data={mensagens}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageBubble,
                    item.id_usuario === idUsuario ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <Text style={styles.messageAuthor}>
                    {item.id_usuario === idUsuario ? 'Você' : item.nome}
                  </Text>
                  <Text style={styles.messageText}>{item.conteudo}</Text>
                </View>
              )}
              contentContainerStyle={styles.messagesContainer}
              inverted={true} // Para que as mensagens mais recentes apareçam na parte inferior
              refreshControl={ // RefreshControl para atualizar mensagens
                <RefreshControl
                  refreshing={refreshingMensagens} // Estado de refresh
                  onRefresh={onRefreshMensagens} // Função para atualizar mensagens
                />
              }
            />

            {/* Input do chat */}
            <KeyboardAvoidingView
              style={styles.inputContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <TextInput
                style={styles.input}
                placeholder="Digite sua mensagem..."
                value={novaMensagem}
                onChangeText={setNovaMensagem}
                onSubmitEditing={enviarMensagem}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.sendButton} onPress={enviarMensagem}>
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4A90E2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo semi-transparente
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 20,
    fontSize: 16,
  },
});

export default FloatingChat;

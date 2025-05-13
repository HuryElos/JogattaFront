import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../services/api';

const InviteFriendsModal = ({ visible, onClose, onInvite, gameId, userId }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [convitesRecebidos, setConvitesRecebidos] = useState([]);

  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  useEffect(() => {
    const fetchConvites = async () => {
      try {
        const response = await api.get('/api/convites/usuario');
        console.log('Convites recebidos:', response.data);
        setConvitesRecebidos(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setConvitesRecebidos([]);
      }
    };
    fetchConvites();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      if (!userId) {
        console.log('userId não definido ao buscar amigos!');
        return;
      }
      const response = await api.get(`/api/amigos/listar/${userId}`);
      const lista = Array.isArray(response.data?.data) ? response.data.data : [];
      setFriends(lista);
      console.log('Amigos carregados:', lista);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error);
      setFriends([]); // garante array mesmo em erro
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const handleInvite = async () => {
    if (selectedFriends.length === 0) return;

    try {
      // Enviar convites para cada amigo selecionado
      const invitePromises = selectedFriends.map(friendId =>
        api.post('/api/convites', {
          id_jogo: gameId,
          id_usuario_convidado: friendId
        })
      );

      await Promise.all(invitePromises);
      onInvite(selectedFriends);
      onClose();
    } catch (error) {
      console.error('Erro ao enviar convites:', error);
    }
  };

  const filteredFriends = Array.isArray(friends)
    ? friends.filter(friend => friend.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const renderFriend = ({ item }) => {
    const isSelected = selectedFriends.includes(item.id);
    console.log('Renderizando amigo:', item);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.selectedFriendItem]}
        onPress={() => toggleFriendSelection(item.id)}
      >
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.friendName}>{item.nome}</Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color="#FF6B00"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Convidar Amigos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar amigos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#FF6B00" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriend}
              keyExtractor={item => item.id.toString()}
              style={styles.friendsList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Nenhum amigo encontrado' : 'Você ainda não tem amigos'}
                </Text>
              }
            />
          )}

          <TouchableOpacity
            style={[
              styles.inviteButton,
              selectedFriends.length === 0 && styles.inviteButtonDisabled
            ]}
            onPress={handleInvite}
            disabled={selectedFriends.length === 0}
          >
            <Text style={styles.inviteButtonText}>
              Convidar {selectedFriends.length} amigo{selectedFriends.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 5,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  friendsList: {
    maxHeight: '60%',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedFriendItem: {
    backgroundColor: '#FFF9F5',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    color: '#1F2937',
  },
  inviteButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  inviteButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  inviteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
  },
});

export default InviteFriendsModal; 
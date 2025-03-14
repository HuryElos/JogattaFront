// src/screens/ViewProfileScreen.js

import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import AuthContext from '../../../contexts/AuthContext';
import api from '../../../services/api';

const ViewProfileScreen = ({ route, navigation }) => {
  const { user: authUser } = useContext(AuthContext);

  const userIdParam = route.params?.userId;
  const isOwnProfile = !userIdParam || userIdParam === authUser?.id;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);

  const [imageUri, setImageUri] = useState(
    authUser?.imagem_perfil || 'https://via.placeholder.com/100'
  );

  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    if (isOwnProfile) {
      setProfileData(authUser);
      setImageUri(authUser?.imagem_perfil || 'https://via.placeholder.com/100');
      setIsFriend(false);
      setLoading(false);
    } else {
      fetchUserData(userIdParam);
    }
  }, [userIdParam]);

  const fetchUserData = async (id) => {
    try {
      const response = await api.get(`/api/usuario/${id}`, {
        params: { organizador_id: authUser.id },
        headers: { Authorization: `Bearer ${authUser.token}` },
      });
      const userData = response.data;
      setProfileData(userData);
      setImageUri(userData?.imagem_perfil || 'https://via.placeholder.com/100');
      setIsFriend(userData?.isfriend || false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async () => {
    if (!isOwnProfile) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão Negada', 'É necessário conceder acesso à galeria para alterar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const response = await api.put(`/api/usuarios/${authUser.id}/foto`, {
          imagem_perfil: result.assets[0].uri,
        });
        setImageUri(response.data.imagem_perfil);

        Alert.alert('Sucesso', 'Foto de perfil atualizada!');
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
      }
    }
  };

  const handleConnect = async () => {
    if (!profileData) return;
    setButtonLoading(true);
    try {
      if (isFriend) {
        await api.post('/api/amigos/remover', {
          organizador_id: authUser.id,
          amigo_id: profileData.id_usuario || profileData.id,
        });
        setIsFriend(false);
        Alert.alert('Sucesso', 'Você desconectou de ' + profileData.nome);
      } else {
        await api.post('/api/amigos/adicionar', {
          organizador_id: authUser.id,
          amigo_id: profileData.id_usuario || profileData.id,
        });
        setIsFriend(true);
        Alert.alert('Sucesso', 'Agora vocês são amigos!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar o status de amizade.');
    } finally {
      setButtonLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Não foi possível carregar o perfil.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarWrapper}>
        <Image source={{ uri: imageUri }} style={styles.avatar} />
        {isOwnProfile && (
          <TouchableOpacity style={styles.editButton} onPress={handleEditImage}>
            <Ionicons name="camera-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileContent}>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{profileData.nome || 'Nome do Usuário'}</Text>
            <Text style={styles.handle}>@{profileData.tt || 'usuario'}</Text>
          </View>

          {!isOwnProfile && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={buttonLoading}
            >
              {buttonLoading ? (
                <ActivityIndicator size="small" color="#FFA726" />
              ) : (
                <Text style={styles.connectButtonText}>
                  {isFriend ? 'Desconectar' : 'Conectar'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            {profileData.descricao
              ? `"${profileData.descricao}"`
              : '"Exemplo de descrição de perfil..."'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insígnias:</Text>
          <View style={styles.insigniaRow}>
            {profileData.insignias && profileData.insignias.length > 0 ? (
              profileData.insignias.map((insignia) => (
                <View key={insignia.id} style={styles.insigniaContainer}>
                  <Image
                    source={{ uri: insignia.image || 'https://via.placeholder.com/60' }}
                    style={styles.insigniaImage}
                  />
                  <Text style={styles.insigniaText}>{insignia.name}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: '#999' }}>Nenhuma insígnia disponível.</Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Partidas:</Text>
          <View style={styles.cardsContainer}>
            {profileData.partidas && profileData.partidas.length > 0 ? (
              profileData.partidas.map((partida) => (
                <View key={partida.id} style={styles.card}>
                  <Ionicons name="calendar-outline" size={30} color="#FFF" />
                  <Text style={styles.cardDate}>{partida.data}</Text>
                  <Text style={styles.cardDescription}>{partida.descricao}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: '#999' }}>Nenhuma partida disponível.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#4A90E2',
    height: 290,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 114,
    alignSelf: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  editButton: {
    position: 'absolute',
    bottom: 10,
    right: -10,
    backgroundColor: '#FFA726',
    padding: 5,
    borderRadius: 15,
    elevation: 5,
  },
  body: {
    flex: 1,
    marginTop: -50,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    padding: 20,
  },
  profileContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  handle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    borderWidth: 1,
    borderColor: '#FFA726',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  connectButtonText: {
    color: '#FFA726',
    fontWeight: 'bold',
  },
  description: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  insigniaRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  insigniaContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  insigniaImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  insigniaText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  card: {
    backgroundColor: '#FFA726',
    width: 160,
    height: 100,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 3,
    justifyContent: 'center',
  },
  cardDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginVertical: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
  },
});

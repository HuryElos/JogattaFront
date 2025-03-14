import React, { useContext, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../../../contexts/AuthContext';
import { editarProfile, atualizarDescricao } from '../../auth/services/authService'; 

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const [imageUri, setImageUri] = useState(user?.profile_image || 'https://via.placeholder.com/100');

  // Estados adicionados para a descrição
  const [descricao, setDescricao] = useState(user?.descricao || "");
  const [isEditingDescricao, setIsEditingDescricao] = useState(false);

  // Referência para o TextInput (usada para o foco automático)
  const descricaoInputRef = useRef(null);

  const MAX_CHARS = 150; // Limite de caracteres para a descrição

  const mockInsignias = [
    { id: '1', name: 'Levantadora', image: 'https://via.placeholder.com/60' },
    { id: '2', name: 'Atacante', image: 'https://via.placeholder.com/60' },
    { id: '3', name: 'Bloqueadora', image: 'https://via.placeholder.com/60' },
  ];

  const mockPartidas = [
    { id: '1', data: '01-12-2024', descricao: 'Atacante e levantadora' },
    { id: '2', data: '05-12-2024', descricao: 'Levantadora' },
  ];

  const handleEditImage = async () => {
    try {
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
        const selectedImageUri = result.assets[0].uri;
        console.log('Imagem selecionada:', selectedImageUri);

        try {
          // Chamada para editar o perfil no backend
          const updatedUser = await editarProfile(selectedImageUri);

          console.log('Resposta do backend ao atualizar imagem de perfil:', updatedUser);

          // Atualiza a imagem localmente
          setImageUri(updatedUser.imagem_perfil);
          setUser((prevUser) => ({
            ...prevUser,
            profile_image: updatedUser.imagem_perfil,
          }));
          Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        } catch (error) {
          console.error('Erro ao atualizar a foto de perfil:', error);
          Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro no processo de edição de imagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar alterar a foto de perfil.');
    }
  };

  const handleSettings = () => {
    navigation.navigate('SettingsScreen'); 
  };

  // Função para salvar a descrição com validação
  const handleSaveDescricao = async () => {
    if (!descricao.trim()) { // Validação para evitar descrição vazia
      Alert.alert("Aviso", "A descrição não pode estar vazia.");
      setDescricao(user?.descricao || ""); // Restaura a descrição original ou limpa o campo
      setIsEditingDescricao(false);
      return;
    }
    try {
      const updatedUser = await atualizarDescricao(descricao); // Chama a função atualizarDescricao
      setUser((prevUser) => ({
        ...prevUser,
        descricao: updatedUser.descricao,
      }));
      Alert.alert("Sucesso", "Descrição atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar a descrição:", error);
      Alert.alert("Erro", "Não foi possível atualizar a descrição.");
    }
  };

  // Função para iniciar a edição da descrição
  const iniciarEdicaoDescricao = () => {
    setIsEditingDescricao(true);
    // Aguardar um ciclo de renderização para garantir que o TextInput esteja visível
    setTimeout(() => {
      descricaoInputRef.current?.focus();
    }, 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettings}
        >
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: imageUri }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.editButton} onPress={handleEditImage}>
          <Ionicons name="camera-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Adicionando ScrollView */}
      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileContent}>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user?.nome || 'Nome do Usuário'}</Text>
            <Text style={styles.handle}>@{user?.tt || 'usuario'}</Text>
          </View>
          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectButtonText}>Conectar</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de descrição com opção de edição */}
        <View style={styles.description}>
          {isEditingDescricao ? (
            <View>
              <TextInput
                ref={descricaoInputRef}
                style={styles.descriptionInput}
                value={descricao}
                onChangeText={(text) => {
                  if (text.length <= MAX_CHARS) setDescricao(text);
                }}
                onBlur={() => {
                  setIsEditingDescricao(false);
                  handleSaveDescricao();
                }}
                placeholder="Digite sua descrição aqui..."
                multiline
                autoFocus
              />
              <Text style={styles.charCounter}>
                {descricao.length}/{MAX_CHARS} caracteres
              </Text>
              {/* Botão opcional para salvar */}
              {/*
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveDescricao}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
              */}
            </View>
          ) : (
            <TouchableOpacity onPress={iniciarEdicaoDescricao}>
              <Text style={styles.descriptionText}>
                {user?.descricao || "Adicione uma descrição ao seu perfil..."}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insígnias:</Text>
          <View style={styles.insigniaRow}>
            {mockInsignias.map((insignia) => (
              <View key={insignia.id} style={styles.insigniaContainer}>
                <Image source={{ uri: insignia.image }} style={styles.insigniaImage} />
                <Text style={styles.insigniaText}>{insignia.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Partidas:</Text>
          <View style={styles.cardsContainer}>
            {mockPartidas.map((partida) => (
              <View key={partida.id} style={styles.card}>
                <Ionicons name="calendar-outline" size={30} color="#FFF" />
                <Text style={styles.cardDate}>{partida.data}</Text>
                <Text style={styles.cardDescription}>{partida.descricao}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
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
  },
  descriptionInput: { // Estilo para o TextInput da descrição
    fontSize: 14,
    color: '#333',
    textAlign: 'left', // Alinhamento à esquerda para melhor leitura
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 10,
  },
  charCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
    marginRight: 15,
  },
  saveButton: { // Estilo para o botão de salvar (opcional)
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
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

export default EditProfileScreen;

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const LiveRoomScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id_jogo } = route.params || {};

  // Estados
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [gameDetails, setGameDetails] = useState({});
  const [confirmedPlayers, setConfirmedPlayers] = useState([]);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [linkSala, setLinkSala] = useState('');
  const [idNumerico, setIdNumerico] = useState('');

  // Obter ID do usuário
  const obterIdUsuario = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado.');
        return;
      }
      const decoded = jwtDecode(token);
      setUserId(decoded.id);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível autenticar o usuário.');
    }
  }, []);

  // Carregar detalhes do jogo
  const carregarDetalhes = useCallback(async () => {
    try {
      const resp = await api.get(`/api/jogos/${id_jogo}/detalhes`);
      if (resp.data) {
        const {
          nome_jogo,
          data_jogo,
          horario_inicio,
          horario_fim,
          descricao,
          chave_pix,
          limite_jogadores,
          id_numerico,
          isOrganizer: respIsOrganizer,
        } = resp.data;
        setGameDetails({
          nome_jogo,
          data_jogo,
          horario_inicio,
          horario_fim,
          descricao,
          chave_pix,
          limite_jogadores,
          local: resp.data.local, // Caso haja campo de local no retorno
        });
        setIdNumerico(id_numerico);
        setIsOrganizer(respIsOrganizer);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do jogo.');
    }
  }, [id_jogo]);

  // Carregar jogadores da sala
  const carregarJogadores = useCallback(async () => {
    try {
      const response = await api.get(`/api/lobby/${id_jogo}/jogadores`);
      if (response.data) {
        const { jogadores } = response.data;
        const confirmados = jogadores.filter((j) => j.status === 'ativo');
        const espera = jogadores.filter((j) => j.status === 'na_espera');
        setConfirmedPlayers(confirmados);
        setWaitingPlayers(espera);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os jogadores.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [id_jogo]);

  // Funções de ações
  const confirmarPresenca = async () => {
    try {
      await api.post('/api/lobby/confirmar-presenca', {
        id_jogo,
        id_usuario: userId,
      });
      Alert.alert('Sucesso', 'Sua presença foi confirmada!');
      carregarJogadores();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao confirmar presença.');
    }
  };

  const criarLinkSala = async () => {
    try {
      const response = await api.post('/api/lobby/convites/gerar', { id_jogo });
      if (response.data?.convite) {
        const conviteId = response.data.convite.convite_uuid;
        if (!conviteId) {
          Alert.alert('Erro', 'Convite inválido.');
          return;
        }
        const linkGerado = `https://jogatta.netlify.app/cadastro?invite=${conviteId}`;
        setLinkSala(linkGerado);
        Alert.alert('Sucesso', 'Link gerado com sucesso!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o link.');
    }
  };

  const compartilharLink = async () => {
    if (!linkSala) {
      Alert.alert('Erro', 'Link não gerado.');
      return;
    }
    try {
      await Share.share({
        message: `Entre na sala usando o ID: ${idNumerico}\nOu acesse: ${linkSala}`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao compartilhar o link.');
    }
  };

  const notificarAusentes = async () => {
    try {
      await api.post('/api/lobby/notificar-na-confirmados', {
        id_jogo,
        test: true,
      });
      Alert.alert('Sucesso', 'Notificações enviadas (modo teste)!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível notificar ausentes.');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDetalhes();
    carregarJogadores();
  }, [carregarDetalhes, carregarJogadores]);

  useEffect(() => {
    if (id_jogo) {
      obterIdUsuario();
      carregarDetalhes();
      carregarJogadores();
    }
  }, [id_jogo, obterIdUsuario, carregarDetalhes, carregarJogadores]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Render de cada jogador (aplica design dos cards do exemplo 1)
  const renderPlayer = ({ item }) => {
    const isConfirmed = item.status === 'ativo' || item.confirmado;
    return (
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
          padding: 12,
          marginBottom: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftColor: isConfirmed ? '#4CAF50' : '#FFC107',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              height: 40,
              width: 40,
              borderRadius: 20,
              backgroundColor: isConfirmed ? '#E6F0FF' : '#F5F5F5',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: '#007AFF' }}>
              {item.nome ? item.nome.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={{ fontWeight: '600' }}>
            {item.nome || 'Jogador Desconhecido'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name={isConfirmed ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={isConfirmed ? '#4CAF50' : '#FFC107'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isConfirmed ? '#4CAF50' : '#FFC107',
            }}
          >
            {isConfirmed ? 'Confirmado' : 'Em espera'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Cabeçalho */}
      <View
        style={{
          backgroundColor: '#007AFF',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
          Sala ao Vivo
        </Text>
      </View>

      {/* Card de detalhes do jogo */}
      <View style={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0A4D95' }}>
            {gameDetails.nome_jogo || `Sala #${id_jogo}`}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons
              name="time-outline"
              size={16}
              color="#666"
              style={{ marginRight: 4 }}
            />
            {gameDetails.data_jogo && (
              <Text style={{ color: '#666' }}>
                {formatDate(gameDetails.data_jogo)} •{' '}
                {gameDetails.horario_inicio?.substring(0, 5)} às{' '}
                {gameDetails.horario_fim?.substring(0, 5)}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons
              name="location-outline"
              size={16}
              color="#666"
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: '#666' }}>
              {gameDetails.local || 'Local não definido'}
            </Text>
          </View>
          {gameDetails.descricao && (
            <Text style={{ marginTop: 12, color: '#444' }}>
              {gameDetails.descricao}
            </Text>
          )}
          {gameDetails.chave_pix && (
            <View
              style={{
                marginTop: 12,
                backgroundColor: '#E6F0FF',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#D0E0FF',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0066CC' }}>
                Chave PIX
              </Text>
              <Text style={{ color: '#003366' }}>{gameDetails.chave_pix}</Text>
            </View>
          )}
          {idNumerico && (
            <Text style={{ marginTop: 12, color: '#666', fontWeight: '600' }}>
              ID da Sala: {idNumerico}
            </Text>
          )}
          {/* Botões de ação */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            {!isOrganizer ? (
              <TouchableOpacity
                onPress={confirmarPresenca}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#007AFF',
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  Confirmar Presença
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={criarLinkSala}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#C7D9FF',
                  }}
                >
                  <Ionicons
                    name="link"
                    size={18}
                    color="#007AFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>
                    Gerar Link
                  </Text>
                </TouchableOpacity>
                {linkSala && (
                  <TouchableOpacity
                    onPress={compartilharLink}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'white',
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#C7D9FF',
                    }}
                  >
                    <Ionicons
                      name="share-social"
                      size={18}
                      color="#007AFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: '#007AFF', fontWeight: '600' }}>
                      Compartilhar Link
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={notificarAusentes}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#C7D9FF',
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#007AFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: '#007AFF', fontWeight: '600' }}>
                    Notificar Ausentes
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Listas de jogadores */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
        {/* Jogadores Confirmados */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#222' }}>
              Jogadores Confirmados
            </Text>
            <View
              style={{
                backgroundColor: '#E6F0FF',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0066CC' }}>
                {confirmedPlayers.length}/{gameDetails.limite_jogadores}
              </Text>
            </View>
          </View>
          <FlatList
            data={confirmedPlayers}
            keyExtractor={(item) => item.id_usuario.toString()}
            renderItem={renderPlayer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
        {/* Lista de Espera */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#222' }}>
              Lista de Espera
            </Text>
            <View
              style={{
                backgroundColor: '#F0F0F0',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#666' }}>
                {waitingPlayers.length}
              </Text>
            </View>
          </View>
          {waitingPlayers.length > 0 ? (
            <FlatList
              data={waitingPlayers}
              keyExtractor={(item) => item.id_usuario.toString()}
              renderItem={renderPlayer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          ) : (
            <View
              style={{
                backgroundColor: '#F5F5F5',
                borderRadius: 8,
                padding: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  backgroundColor: '#EEEEEE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Ionicons name="people" size={24} color="#999" />
              </View>
              <Text style={{ color: '#666' }}>
                Nenhum jogador na lista de espera
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default LiveRoomScreen;

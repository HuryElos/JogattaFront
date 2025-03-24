// src/features/jogos/screens/LiveRoomScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CofreActions from '../components/cofre/CofreActions'; // Importa o componente de cofre

const { width } = Dimensions.get('window');

const STATUS_COLORS = {
  'aprovada': '#34D399', // Verde
  'pendente': '#F59E0B', // Amarelo
  'rejeitada': '#EF4444', // Vermelho
  'aberto': '#34D399',   // Verde
  'em andamento': '#3B82F6', // Azul
  'balanceando times': '#F59E0B', // Amarelo
  'cancelado': '#9CA3AF', // Cinza
};

const STATUS_ICONS = {
  'aprovada': 'checkmark-circle',
  'pendente': 'time',
  'rejeitada': 'close-circle',
  'aberto': 'checkmark-circle',
  'em andamento': 'play',
  'balanceando times': 'people',
  'cancelado': 'close',
};

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
  const [activeTab, setActiveTab] = useState('confirmados');

  // Estados para status da reserva
  const [reservationStatus, setReservationStatus] = useState('pendente');
  const [statusMessage, setStatusMessage] = useState('');
  const [reservationId, setReservationId] = useState(null); // ID da reserva para liberar o cofre

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
          status,
          local,
          nome_quadra,
          nome_empresa
        } = resp.data;
        
        setGameDetails({
          nome_jogo,
          data_jogo,
          horario_inicio,
          horario_fim,
          descricao,
          chave_pix,
          limite_jogadores,
          local,
          nome_quadra,
          nome_empresa,
          status
        });
        
        setIdNumerico(id_numerico);
        setIsOrganizer(respIsOrganizer);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
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
      console.error('Erro ao carregar jogadores:', error);
      Alert.alert('Erro', 'Não foi possível carregar os jogadores.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [id_jogo]);

  // Função para buscar status da reserva
  const carregarStatusReserva = useCallback(async () => {
    try {
      const response = await api.get(`/api/jogos/${id_jogo}/reserva-status`);
      if (response.data) {
        setReservationStatus(response.data.status);
        if (response.data.id_reserva) {
          setReservationId(response.data.id_reserva);
        }
        // Define a mensagem com base no status
        switch (response.data.status) {
          case 'aprovada':
            setStatusMessage('A reserva foi confirmada pelo dono da quadra. Sua partida está garantida!');
            break;
          case 'rejeitada':
            setStatusMessage('Infelizmente, sua reserva foi rejeitada pelo dono da quadra. Tente escolher outra quadra ou horário.');
            break;
          case 'pendente':
            setStatusMessage('Sua reserva está aguardando confirmação do dono da quadra. Você receberá uma notificação quando for atualizada.');
            break;
          default:
            setStatusMessage('');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status da reserva:', error);
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
      console.error('Erro ao confirmar presença:', error);
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
      console.error('Erro ao criar link:', error);
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
        message: `Venha jogar vôlei comigo! Entre na sala "${gameDetails.nome_jogo}" usando o ID: ${idNumerico}\nOu acesse: ${linkSala}`,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Falha ao compartilhar o link.');
    }
  };

  const notificarAusentes = async () => {
    try {
      await api.post('/api/lobby/notificar-na-confirmados', {
        id_jogo,
        test: true,
      });
      Alert.alert('Sucesso', 'Notificações enviadas para jogadores não confirmados!');
    } catch (error) {
      console.error('Erro ao notificar ausentes:', error);
      Alert.alert('Erro', 'Não foi possível notificar ausentes.');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      carregarDetalhes(), 
      carregarJogadores(), 
      carregarStatusReserva()
    ]).finally(() => setRefreshing(false));
  }, [carregarDetalhes, carregarJogadores, carregarStatusReserva]);

  useEffect(() => {
    if (id_jogo) {
      obterIdUsuario();
      carregarDetalhes();
      carregarJogadores();
      carregarStatusReserva();
    }
  }, [id_jogo, obterIdUsuario, carregarDetalhes, carregarJogadores, carregarStatusReserva]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return 'Hoje';
      } else if (isBefore(date, new Date()) && !isToday(date)) {
        return 'Já ocorreu';  
      } else {
        return format(date, "dd 'de' MMMM", { locale: ptBR });
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  // Render de cada jogador com design aprimorado
  const renderPlayer = ({ item, index }) => {
    const isConfirmed = item.status === 'ativo' || item.confirmado;
    const hashCode = item.nome?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const hue = hashCode % 360;
    const saturation = 80;
    const lightness = 92;

    return (
      <View 
        style={[
          styles.playerCard,
          { opacity: 1, transform: [{ translateY: 0 }] }
        ]}
      >
        <View style={styles.playerContent}>
          <View 
            style={[
              styles.playerAvatar,
              { backgroundColor: isConfirmed ? `hsl(${hue}, ${saturation}%, ${lightness}%)` : '#F5F5F5' }
            ]}
          >
            <Text style={[
              styles.playerInitial, 
              { color: isConfirmed ? `hsl(${hue}, ${saturation}%, 45%)` : '#999' }
            ]}>
              {item.nome ? item.nome.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{item.nome || 'Jogador Desconhecido'}</Text>
            {item.posicao && (
              <View style={styles.playerPositionContainer}>
                <Text style={styles.playerPosition}>{item.posicao}</Text>
              </View>
            )}
          </View>
          
          <View style={[
            styles.playerStatusBadge,
            { backgroundColor: isConfirmed ? '#E6F7EF' : '#FFF9E6', borderColor: isConfirmed ? '#34D399' : '#F59E0B' }
          ]}>
            <MaterialCommunityIcons 
              name={isConfirmed ? "check-circle" : "clock-outline"} 
              size={14} 
              color={isConfirmed ? '#34D399' : '#F59E0B'} 
            />
            <Text style={[
              styles.playerStatusText,
              { color: isConfirmed ? '#34D399' : '#F59E0B' }
            ]}>
              {isConfirmed ? 'Confirmado' : 'Em espera'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Renderizar o estado vazio para cada lista
  const renderEmptyPlayersList = (type) => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name={type === 'confirmados' ? "account-group" : "account-clock"} 
        size={40} 
        color="#CCC" 
      />
      <Text style={styles.emptyTitle}>
        {type === 'confirmados' ? 'Nenhum jogador confirmado' : 'Lista de espera vazia'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {type === 'confirmados'
          ? 'Seja o primeiro a confirmar presença nesta partida!'
          : 'Não há jogadores aguardando para entrar na partida.'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Carregando sala...</Text>
      </View>
    );
  }

  const gameStatus = gameDetails.status || 'pendente';
  const statusColor = STATUS_COLORS[gameStatus] || STATUS_COLORS['pendente'];
  const statusIcon = STATUS_ICONS[gameStatus] || 'information-circle';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B00" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
      >
        {/* Card laranja com informações principais */}
        <View style={styles.orangeCard}>
          <View style={styles.gameNameContainer}>
            <Text style={styles.gameName} numberOfLines={1}>
              {gameDetails.nome_jogo || `Sala #${id_jogo}`}
            </Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#FFF" />
              <Text style={styles.infoText}>
                {gameDetails.horario_inicio?.substring(0, 5)} - {gameDetails.horario_fim?.substring(0, 5)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar" size={18} color="#FFF" />
              <Text style={styles.infoText}>
                {formatDate(gameDetails.data_jogo)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#FFF" />
              <Text style={styles.infoText} numberOfLines={1}>
                {gameDetails.local || 'Local não definido'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons 
              name={gameDetails.status === 'aberto' ? "check-circle" : "clock-outline"} 
              size={16} 
              color="#FFF" 
            />
            <Text style={styles.statusText}>
              {(gameDetails.status || 'pendente').charAt(0).toUpperCase() + (gameDetails.status || 'pendente').slice(1)}
            </Text>
          </View>
        </View>

        {/* Informações do Jogo */}
        <View style={styles.gameInfoCard}>
          <View style={styles.gameDetailsSection}>
            <View style={styles.gameInfoRow}>
              <MaterialCommunityIcons name="handball" size={20} color="#666" />
              <Text style={styles.gameInfoText}>
                Quadra: {gameDetails.nome_quadra || 'Não definida'} {gameDetails.nome_empresa ? ` • ${gameDetails.nome_empresa}` : ''}
              </Text>
            </View>
            <View style={styles.gameInfoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color="#666" />
              <Text style={styles.gameInfoText}>
                {confirmedPlayers.length}/{gameDetails.limite_jogadores || '∞'} jogadores confirmados
              </Text>
            </View>
          </View>
          
          {gameDetails.descricao && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Sobre o jogo</Text>
              <Text style={styles.descriptionText}>{gameDetails.descricao}</Text>
            </View>
          )}
          
          {gameDetails.chave_pix && (
            <View style={styles.pixContainer}>
              <View style={styles.pixHeader}>
                <MaterialCommunityIcons name="cash" size={20} color="#0066CC" />
                <Text style={styles.pixTitle}>Chave PIX</Text>
              </View>
              <Text style={styles.pixText}>{gameDetails.chave_pix}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => {
                  try {
                    Clipboard.setString(gameDetails.chave_pix);
                    Alert.alert('Copiado', 'Chave PIX copiada para a área de transferência');
                  } catch (e) {
                    console.error('Erro ao copiar:', e);
                  }
                }}
              >
                <MaterialCommunityIcons name="content-copy" size={14} color="#0066CC" />
                <Text style={styles.copyText}>Copiar chave</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {idNumerico && (
            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>ID da Sala:</Text>
              <Text style={styles.idValue}>{idNumerico}</Text>
            </View>
          )}
          
          {/* Ações para jogadores não organizadores */}
          {!isOrganizer && (
            <TouchableOpacity
              style={styles.mainActionButton}
              onPress={confirmarPresenca}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
              <Text style={styles.mainActionText}>Confirmar Presença</Text>
            </TouchableOpacity>
          )}
          
          {/* Ações para organizadores */}
          {isOrganizer && (
            <View style={styles.organizerActions}>
              <Text style={styles.organizerActionsTitle}>Ações do Organizador</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={criarLinkSala}
                >
                  <View style={[styles.actionButtonGradient, { backgroundColor: '#3B82F6' }]}>
                    <MaterialCommunityIcons name="link-variant" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Gerar Link</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, !linkSala && styles.actionButtonDisabled]}
                  onPress={compartilharLink}
                  disabled={!linkSala}
                >
                  <View style={[styles.actionButtonGradient, { backgroundColor: linkSala ? '#10B981' : '#9CA3AF' }]}>
                    <MaterialCommunityIcons name="share-variant" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Compartilhar</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.notifyButton}
                onPress={notificarAusentes}
              >
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#FF6B00" />
                <Text style={styles.notifyButtonText}>Notificar Jogadores Não Confirmados</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Status da Reserva */}
        {reservationStatus && (
          <View style={[
            styles.reservationStatusCard,
            { 
              backgroundColor: reservationStatus === 'aprovada' ? '#E6F7EF' : reservationStatus === 'rejeitada' ? '#FEEBEB' : '#FFF9E6',
              borderLeftColor: reservationStatus === 'aprovada' ? '#34D399' : reservationStatus === 'rejeitada' ? '#EF4444' : '#F59E0B',
            }
          ]}>
            <View style={styles.reservationStatusHeader}>
              <MaterialCommunityIcons 
                name={
                  reservationStatus === 'aprovada'
                    ? 'check-circle'
                    : reservationStatus === 'rejeitada'
                    ? 'close-circle'
                    : 'clock-outline'
                } 
                size={22} 
                color={
                  reservationStatus === 'aprovada'
                    ? '#34D399'
                    : reservationStatus === 'rejeitada'
                    ? '#EF4444'
                    : '#F59E0B'
                } 
              />
              <Text style={[
                styles.reservationStatusTitle,
                { 
                  color: reservationStatus === 'aprovada' ? '#34D399' : reservationStatus === 'rejeitada' ? '#EF4444' : '#F59E0B'
                }
              ]}>
                {reservationStatus === 'aprovada'
                  ? 'Reserva Confirmada'
                  : reservationStatus === 'rejeitada'
                  ? 'Reserva Rejeitada'
                  : 'Aguardando Confirmação'}
              </Text>
            </View>
            <Text style={styles.reservationStatusMessage}>{statusMessage}</Text>
            {reservationStatus === 'rejeitada' && isOrganizer && (
              <TouchableOpacity
                style={styles.reservationActionButton}
                onPress={() => navigation.navigate('JogosFlow', { screen: 'CriarJogo' })}
              >
                <MaterialCommunityIcons name="handball" size={16} color="#FFF" />
                <Text style={styles.reservationActionText}>Buscar outra quadra</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Componente de Cofre - visível apenas se o usuário for organizador e a reserva estiver aprovada */}
        {isOrganizer && reservationStatus === 'aprovada' && reservationId && (
          <CofreActions reservaId={reservationId} />
        )}
        
        {/* Seção de Jogadores com Tabs */}
        <View style={styles.playersSection}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'confirmados' && styles.activeTab]}
              onPress={() => setActiveTab('confirmados')}
            >
              <Text style={[styles.tabText, activeTab === 'confirmados' && styles.activeTabText]}>
                Confirmados ({confirmedPlayers.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'espera' && styles.activeTab]}
              onPress={() => setActiveTab('espera')}
            >
              <Text style={[styles.tabText, activeTab === 'espera' && styles.activeTabText]}>
                Em Espera ({waitingPlayers.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.playersListContainer}>
            {activeTab === 'confirmados' && (
              confirmedPlayers.length > 0 ? (
                confirmedPlayers.map((player, index) => renderPlayer({ item: player, index }))
              ) : (
                renderEmptyPlayersList('confirmados')
              )
            )}
            {activeTab === 'espera' && (
              waitingPlayers.length > 0 ? (
                waitingPlayers.map((player, index) => renderPlayer({ item: player, index }))
              ) : (
                renderEmptyPlayersList('espera')
              )
            )}
          </View>
        </View>
        
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  contentContainer: { paddingTop: 0, paddingBottom: 20 },
  orangeCard: { backgroundColor: '#FF6B00', padding: 16 },
  gameNameContainer: { marginBottom: 12 },
  gameName: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 2 },
  infoContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  infoText: { color: 'white', fontSize: 15, marginLeft: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  gameInfoCard: { backgroundColor: '#FFF', borderRadius: 16, marginHorizontal: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  gameDetailsSection: { marginBottom: 16 },
  gameInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gameInfoText: { fontSize: 15, color: '#4B5563', marginLeft: 10, flex: 1 },
  descriptionContainer: { marginTop: 5, marginBottom: 16, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  descriptionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  descriptionText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  pixContainer: { backgroundColor: '#E6F0FF', padding: 12, borderRadius: 8, marginBottom: 16 },
  pixHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pixTitle: { fontSize: 15, fontWeight: '600', color: '#0066CC', marginLeft: 6 },
  pixText: { fontSize: 15, color: '#1E40AF', marginBottom: 8 },
  copyButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.6)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  copyText: { color: '#0066CC', fontSize: 12, marginLeft: 4 },
  idContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  idLabel: { fontSize: 14, color: '#4B5563' },
  idValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  mainActionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF6B00', paddingVertical: 12, borderRadius: 8 },
  mainActionText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  organizerActions: { marginTop: 10 },
  organizerActionsTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  actionButton: { flex: 1, marginHorizontal: 4, height: 44, borderRadius: 8, overflow: 'hidden' },
  actionButtonDisabled: { opacity: 0.7 },
  actionButtonGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  actionButtonText: { color: '#FFF', fontWeight: '600', marginLeft: 6 },
  notifyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F5', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FFEDD5' },
  notifyButtonText: { fontSize: 14, fontWeight: '600', color: '#FF6B00', marginLeft: 8 },
  reservationStatusCard: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  reservationStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reservationStatusTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  reservationStatusMessage: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  reservationActionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start', marginTop: 12 },
  reservationActionText: { fontSize: 14, fontWeight: '600', color: '#FFF', marginLeft: 6 },
  playersSection: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#FF6B00' },
  tabText: { fontSize: 14, color: '#6B7280' },
  activeTabText: { color: '#FF6B00', fontWeight: '600' },
  playersListContainer: { padding: 16, minHeight: 200 },
  playerCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  playerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerAvatar: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  playerInitial: { fontSize: 18, fontWeight: 'bold' },
  playerInfo: { flex: 1, justifyContent: 'center' },
  playerName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  playerPositionContainer: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  playerPosition: { fontSize: 12, color: '#4B5563' },
  playerStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  playerStatusText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});

export default LiveRoomScreen;

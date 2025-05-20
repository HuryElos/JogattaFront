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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CofreActions from '../components/cofre/CofreActions';
import PagamentoStripe from '../components/PagamentoStripe';
import CheckoutCofreModal from '../components/CheckoutCofreModal';
import InviteFriendsModal from '../components/InviteFriendsModal';

const { width } = Dimensions.get('window');

interface GameDetails {
  nome_jogo?: string;
  data_jogo?: string;
  horario_inicio?: string;
  horario_fim?: string;
  descricao?: string;
  chave_pix?: string;
  limite_jogadores?: number;
  local?: string;
  nome_quadra?: string;
  nome_empresa?: string;
  status?: string;
}

interface Player {
  id?: number;
  id_usuario?: number;
  nome?: string;
  status?: string;
  confirmado?: boolean;
  pagamento_confirmado?: boolean;
}

interface Cofre {
  valor_total?: number;
  valor_pago?: number;
  pagantes?: number;
}

interface RouteParams {
  id_jogo: number;
}

const STATUS_COLORS: Record<string, string> = {
  'aprovada': '#34D399',
  'pendente': '#F59E0B',
  'rejeitada': '#EF4444',
  'aberto': '#34D399',
  'em andamento': '#3B82F6',
  'balanceando times': '#F59E0B',
  'cancelado': '#9CA3AF',
};

const STATUS_ICONS: Record<string, string> = {
  'aprovada': 'check-circle',
  'pendente': 'time',
  'rejeitada': 'close-circle',
  'aberto': 'check-circle',
  'em andamento': 'play',
  'balanceando times': 'people',
  'cancelado': 'close',
};

interface TransacaoParams {
  id_reserva: number;
  id_usuario: number;
  payment_intent_id: string;
  valor_total: number;
  valor_repasse: number;
  taxa_jogatta: number;
}

// Função para registrar transação
async function registrarTransacao({
  id_reserva,
  id_usuario,
  payment_intent_id,
  valor_total,
  valor_repasse,
  taxa_jogatta
}: TransacaoParams): Promise<void> {
  try {
    await api.post('/api/pagamento/criar-transacao', {
      id_reserva,
      id_usuario,
      stripe_payment_intent_id: payment_intent_id,
      valor_total,
      valor_repasse,
      taxa_jogatta
    });
    console.log('✅ Transação registrada com sucesso.');
  } catch (error: any) {
    console.error('❌ Erro ao registrar transação:', error.response?.data || error.message);
    throw error;
  }
}

const LiveRoomScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation();
  const { id_jogo } = route.params || {};

  // Estados
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  const [gameDetails, setGameDetails] = useState<GameDetails>({});
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
  const [waitingPlayers, setWaitingPlayers] = useState<Player[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [linkSala, setLinkSala] = useState<string>('');
  const [idNumerico, setIdNumerico] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'confirmados' | 'espera'>('confirmados');

  // Estados de pagamento e reserva
  const [reservationStatus, setReservationStatus] = useState<string>('pendente');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [hasPaid, setHasPaid] = useState<boolean>(false);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [quadraPreco, setQuadraPreco] = useState<number>(0);

  // Cofre
  const [cofre, setCofre] = useState<Cofre | null>(null);

  // Modal de checkout
  const [mostrarCheckout, setMostrarCheckout] = useState<boolean>(false);

  // Modal de convite de amigos
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);

  const forcarAtualizacaoCofre = async (valorPorJogador: number): Promise<boolean> => {
    if (!reservationId) return false;
    
    try {
      console.log('Forçando atualização do cofre com valor:', valorPorJogador);
      
      const response = await api.post('/api/jogador/reservas/pagar', {
        reserva_id: reservationId,
        valor_pago: valorPorJogador,
        id_usuario: userId,
        force_update: true,
        is_test: true
      });
      
      console.log('Resposta da atualização forçada:', response.data);
      
      const cofreResponse = await api.get(`/api/jogador/reservas/${reservationId}/cofre`);
      if (cofreResponse.data) {
        console.log('Novo estado do cofre:', cofreResponse.data);
        setCofre(cofreResponse.data);
      }
      
      await carregarJogadores();
      
      return true;
    } catch (error: any) {
      console.error('Erro ao forçar atualização do cofre:', error);
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      return false;
    }
  };

  const forcarAtualizacaoStatusJogador = async (): Promise<boolean> => {
    if (!id_jogo || !userId) return false;
    
    console.log('===> Forçando atualização do status do jogador <===');
    
    try {
      const response = await api.post('/api/debug/execute-sql', {
        query: `UPDATE participacao_jogos 
                  SET pagamento_confirmado = TRUE, 
                      data_pagamento = NOW() 
                WHERE id_jogo = $1 AND id_usuario = $2`,
        params: [id_jogo, userId]
      });
      
      console.log('Resposta da atualização de status:', response.data);
      
      await carregarJogadores();
      
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar status do jogador:', error);
      return false;
    }
  };

  const obterIdUsuario = useCallback(async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado.');
        return;
      }
      const decoded = jwtDecode(token) as { id: number };
      setUserId(decoded.id);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível autenticar o usuário.');
    }
  }, []);

  const carregarDetalhes = useCallback(async (): Promise<void> => {
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
          nome_empresa,
          preco_quadra,
          ownerId: donoQuadra
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

        if (preco_quadra) {
          setQuadraPreco(Math.round(preco_quadra * 100));
        }
        if (donoQuadra) {
          setOwnerId(donoQuadra);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar detalhes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do jogo.');
    }
  }, [id_jogo]);

  const carregarJogadores = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get(`/api/lobby/${id_jogo}/jogadores`);
      if (response.data) {
        const { jogadores } = response.data;
        const confirmados = jogadores.filter((j: Player) => j.status === 'ativo');
        const espera = jogadores.filter((j: Player) => j.status === 'na_espera');
        setConfirmedPlayers(confirmados);
        setWaitingPlayers(espera);

        const eu = jogadores.find((j: Player) => j.id_usuario === userId);
        if (eu?.pagamento_confirmado) {
          setHasPaid(true);
        } else {
          setHasPaid(false);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar jogadores:', error);
      Alert.alert('Erro', 'Não foi possível carregar os jogadores.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [id_jogo, userId]);

  const carregarStatusReserva = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get(`/api/jogos/${id_jogo}/reserva-status`);
      if (response.data) {
        setReservationStatus(response.data.status);
        if (response.data.id_reserva) {
          setReservationId(response.data.id_reserva);
          console.log('Reserva ID carregado:', response.data.id_reserva);
        }
        switch (response.data.status) {
          case 'aprovada':
            setStatusMessage('A reserva foi confirmada pelo dono da quadra.');
            break;
          case 'rejeitada':
            setStatusMessage('Infelizmente, a reserva foi rejeitada pelo dono da quadra.');
            break;
          case 'pendente':
            setStatusMessage('Sua reserva está aguardando confirmação.');
            break;
          default:
            setStatusMessage('');
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar status da reserva:', error);
    }
  }, [id_jogo]);

  const carregarCofre = useCallback(async (): Promise<void> => {
    if (!reservationId) return;
    try {
      const response = await api.get(`/api/jogador/reservas/${reservationId}/cofre`);
      console.log('Cofre atualizado:', response.data);
      if (response.data) {
        setCofre(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar cofre:', error);
    }
  }, [reservationId]);

  const confirmarPresenca = async (): Promise<void> => {
    try {
      await api.post('/api/lobby/confirmar-presenca', {
        id_jogo,
        id_usuario: userId,
      });
      Alert.alert('Sucesso', 'Sua presença foi confirmada!');
      carregarJogadores();
    } catch (error: any) {
      console.error('Erro ao confirmar presença:', error);
      Alert.alert('Erro', 'Falha ao confirmar presença.');
    }
  };

  const criarLinkSala = async (): Promise<void> => {
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
    } catch (error: any) {
      console.error('Erro ao criar link:', error);
      Alert.alert('Erro', 'Não foi possível gerar o link.');
    }
  };

  const compartilharLink = async (): Promise<void> => {
    try {
      // Primeiro gera o link
      const response = await api.post('/api/lobby/convites/gerar', { id_jogo });
      if (response.data?.convite) {
        const conviteId = response.data.convite.convite_uuid;
        if (!conviteId) {
          Alert.alert('Erro', 'Convite inválido.');
          return;
        }
        const linkGerado = `https://jogatta.netlify.app/cadastro?invite=${conviteId}`;
        setLinkSala(linkGerado);
        
        // Compartilha o link gerado
        await Share.share({
          message: `Venha jogar vôlei comigo! Sala "${gameDetails.nome_jogo}" (ID: ${idNumerico})\nAcesse: ${linkGerado}`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Não foi possível gerar e compartilhar o link.');
    }
  };

  const notificarAusentes = async (): Promise<void> => {
    try {
      await api.post('/api/lobby/notificar-na-confirmados', {
        id_jogo,
        test: true,
      });
      Alert.alert('Sucesso', 'Notificações enviadas!');
    } catch (error: any) {
      console.error('Erro ao notificar ausentes:', error);
      Alert.alert('Erro', 'Não foi possível notificar ausentes.');
    }
  };

  const handleInviteFriends = (selectedFriends: Player[]): void => {
    Alert.alert(
      'Sucesso',
      `Convite enviado para ${selectedFriends.length} amigo${selectedFriends.length !== 1 ? 's' : ''}!`
    );
  };

  const onRefresh = useCallback((): void => {
    setRefreshing(true);
    Promise.all([
      carregarDetalhes(),
      carregarJogadores(),
      carregarStatusReserva(),
      carregarCofre()
    ]).finally(() => setRefreshing(false));
  }, [carregarDetalhes, carregarJogadores, carregarStatusReserva, carregarCofre]);

  useEffect(() => {
    if (id_jogo) {
      obterIdUsuario();
    }
  }, [id_jogo, obterIdUsuario]);

  useEffect(() => {
    if (!userId) return;
    carregarDetalhes();
    carregarStatusReserva();
  }, [userId, carregarDetalhes, carregarStatusReserva]);

  useEffect(() => {
    if (reservationId && userId) {
      console.log('Carregando cofre com reservationId:', reservationId);
      carregarCofre();
      carregarJogadores();
    }
  }, [reservationId, userId, carregarCofre, carregarJogadores]);

  const formatDate = (dateString: string | undefined): string => {
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

  const renderPlayer = ({ item, index }: { item: Player; index: number }): JSX.Element => {
    const isConfirmed = item.status === 'ativo' || item.confirmado;
    const hashCode = item.nome?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const hue = hashCode % 360;
    const saturation = 80;
    const lightness = 92;

    return (
      <View 
        key={item.id || `player-${index}`}
        style={styles.playerCard}
      >
        <View style={styles.playerContent}>
          <View 
            style={[
              styles.playerAvatar,
              {
                borderWidth: 3,
                borderColor: isConfirmed ? '#34D399' : '#EF4444',
                backgroundColor: isConfirmed ? `hsl(${hue}, ${saturation}%, ${lightness}%)` : '#F5F5F5'
              }
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
          </View>
          
          <View style={[
            styles.playerStatusBadge,
            {
              backgroundColor: isConfirmed ? '#E6F7EF' : '#FFF9E6',
              borderColor: isConfirmed ? '#34D399' : '#F59E0B'
            }
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

  const renderEmptyPlayersList = (type: string): JSX.Element => (
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
          ? 'Seja o primeiro a confirmar presença!'
          : 'Não há jogadores aguardando.'}
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
        {/* Card laranja com os detalhes principais do jogo */}
        <View style={styles.orangeCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.gameName} numberOfLines={1}>
                {gameDetails.nome_jogo || `Sala #${id_jogo}`}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#FFF" />
                <Text style={[styles.infoText, { marginLeft: 4 }]}>{gameDetails.local || 'Local não definido'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialCommunityIcons name="calendar" size={16} color="#FFF" />
                <Text style={[styles.infoText, { marginLeft: 4 }]}>{formatDate(gameDetails.data_jogo)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#FFF" />
                <Text style={[styles.infoText, { marginLeft: 4 }]}>{gameDetails.horario_inicio?.substring(0, 5)} - {gameDetails.horario_fim?.substring(0, 5)}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Reservado</Text>
              <MaterialCommunityIcons name="check-circle" size={28} color="#34D399" style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>

        {/* Card com os detalhes do jogo */}
        <View style={styles.gameInfoCard}>
          <View style={styles.gameDetailsSection}>
            <View style={styles.gameInfoRow}>
              <MaterialCommunityIcons name="handball" size={20} color="#666" />
              <Text style={styles.gameInfoText}>
                Quadra: {gameDetails.nome_quadra || 'Não definida'} 
                {gameDetails.nome_empresa ? ` • ${gameDetails.nome_empresa}` : ''}
              </Text>
            </View>
            <View style={styles.gameInfoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color="#666" />
              <Text style={styles.gameInfoText}>
                {confirmedPlayers.length}/{gameDetails.limite_jogadores || '∞'} jogadores
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
            </View>
          )}
          
          {idNumerico && (
            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>ID da Sala:</Text>
              <Text style={styles.idValue}>{idNumerico}</Text>
            </View>
          )}
          
          {!isOrganizer && (
            <TouchableOpacity
              style={styles.mainActionButton}
              onPress={confirmarPresenca}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
              <Text style={styles.mainActionText}>Confirmar Presença</Text>
            </TouchableOpacity>
          )}
          
          {isOrganizer && (
            <View style={styles.organizerActions}>
              <View style={styles.organizerHeader}>
                <MaterialCommunityIcons name="account-cog" size={24} color="#FF6B00" />
                <Text style={styles.organizerActionsTitle}>Painel do Organizador</Text>
              </View>

              <View style={styles.organizerRow}>
                <TouchableOpacity
                  style={[styles.organizerCard, { backgroundColor: '#FFF5EB', flex: 1 }]}
                  onPress={() => setShowInviteModal(true)}
                >
                  <View style={[styles.organizerCardIcon, { backgroundColor: '#FF6B00' }]}>
                    <MaterialCommunityIcons name="account-plus" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.organizerCardTitle}>Convidar</Text>
                  <Text style={styles.organizerCardSubtitle}>Adicionar jogadores</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.organizerCard, { backgroundColor: '#F0FDF4', flex: 1 }]}
                  onPress={compartilharLink}
                >
                  <View style={[styles.organizerCardIcon, { backgroundColor: '#10B981' }]}>
                    <MaterialCommunityIcons name="share-variant" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.organizerCardTitle}>Compartilhar</Text>
                  <Text style={styles.organizerCardSubtitle}>Link da sala</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.organizerCard, { backgroundColor: '#FEF3C7', flex: 1 }]}
                  onPress={notificarAusentes}
                >
                  <View style={[styles.organizerCardIcon, { backgroundColor: '#F59E0B' }]}>
                    <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.organizerCardTitle}>Notificar</Text>
                  <Text style={styles.organizerCardSubtitle}>Lembrar jogadores</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        {/* Status da reserva */}
        {reservationStatus && (
          <View style={[
            styles.reservationStatusCard,
            { 
              backgroundColor: reservationStatus === 'aprovada' 
                ? '#E6F7EF' 
                : reservationStatus === 'rejeitada' 
                ? '#FEEBEB' 
                : '#FFF9E6',
              borderLeftColor: reservationStatus === 'aprovada' 
                ? '#34D399' 
                : reservationStatus === 'rejeitada' 
                ? '#EF4444' 
                : '#F59E0B',
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
                  color: reservationStatus === 'aprovada' 
                    ? '#34D399' 
                    : reservationStatus === 'rejeitada'
                    ? '#EF4444'
                    : '#F59E0B'
                }
              ]}>
                {reservationStatus === 'aprovada'
                  ? 'Reserva Confirmada'
                  : reservationStatus === 'rejeitada'
                  ? 'Reserva Rejeitada'
                  : 'Aguardando Confirmação'}
              </Text>
            </View>
            <Text style={styles.reservationStatusMessage}>
              {statusMessage}
            </Text>
          </View>
        )}

        {/* Componente do Cofre renderizado para todos */}
        {reservationStatus === 'aprovada' && reservationId && (
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentIconContainer}>
                <MaterialCommunityIcons name="piggy-bank-outline" size={32} color="#FF6B00" />
              </View>
              <View style={styles.paymentTitleContainer}>
                <Text style={styles.paymentTitle}>Cofre do Jogo</Text>
                <Text style={styles.paymentSubtitle}>Acompanhe os pagamentos</Text>
              </View>
            </View>

            <View style={styles.paymentAmountContainer}>
              <View style={styles.paymentAmountInfo}>
                <Text style={styles.paymentAmountLabel}>Valor Total</Text>
                <Text style={styles.paymentAmount}>
                  R$ {cofre?.valor_total != null ? parseFloat(cofre.valor_total.toString()).toFixed(2) : quadraPreco ? (quadraPreco / 100).toFixed(2) : '0.00'}
                </Text>
                <Text style={styles.paymentPerPlayer}>
                  R$ {quadraPreco ? (quadraPreco / (gameDetails.limite_jogadores || confirmedPlayers.length) / 100).toFixed(2) : '0.00'} por jogador  </Text>
              </View>
              <View style={styles.paymentProgressInfo}>
                <Text style={styles.paymentProgressText}>
                  {cofre?.pagantes || 0}/{gameDetails.limite_jogadores || confirmedPlayers.length} pagaram
                </Text>
                <Text style={styles.paymentProgressPercentage}>
                  {Math.round(((cofre?.valor_pago || 0) / 100 / (cofre?.valor_total || 1)) * 100)}% arrecadado
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(
                        ((cofre?.valor_pago || 0) / (cofre?.valor_total || 1)) * 100, 
                        100
                      )}%` 
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  R$ {cofre?.valor_pago != null ? (cofre.valor_pago / 100).toFixed(2) : '0.00'}
                </Text>
                <Text style={styles.progressLabel}>
                  R$ {cofre?.valor_total != null ? parseFloat(cofre.valor_total.toString()).toFixed(2) : quadraPreco ? (quadraPreco / 100).toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>

            <View style={styles.paymentDetailsContainer}>
              <View style={styles.paymentDetailsRow}>
                <View style={styles.paymentDetailsItem}>
                  <MaterialCommunityIcons name="cash-multiple" size={20} color="#6B7280" />
                  <Text style={styles.paymentDetailsLabel}>Total</Text>
                  <Text style={styles.paymentDetailsValue}>
                    R$ {cofre?.valor_total != null ? parseFloat(cofre.valor_total.toString()).toFixed(2) : quadraPreco ? (quadraPreco / 100).toFixed(2) : '0.00'}
                  </Text>
                </View>
                <View style={styles.paymentDetailsItem}>
                  <MaterialCommunityIcons name="cash-check" size={20} color="#6B7280" />
                  <Text style={styles.paymentDetailsLabel}>Arrecadado</Text>
                  <Text style={styles.paymentDetailsValue}>
                    R$ {cofre?.valor_pago != null ? (cofre.valor_pago / 100).toFixed(2) : '0.00'}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentDetailsRow}>
                <View style={styles.paymentDetailsItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#6B7280" />
                  <Text style={styles.paymentDetailsLabel}>Jogadores</Text>
                  <Text style={styles.paymentDetailsValue}>{gameDetails.limite_jogadores || confirmedPlayers.length}</Text>
                </View>
                <View style={styles.paymentDetailsItem}>
                  <MaterialCommunityIcons name="cash" size={20} color="#6B7280" />
                  <Text style={styles.paymentDetailsLabel}>Por Jogador</Text>
                  <Text style={styles.paymentDetailsValue}>
                    R$ {quadraPreco ? (quadraPreco / (gameDetails.limite_jogadores || confirmedPlayers.length) / 100).toFixed(2) : '0.00'}
                  </Text>
                </View>
              </View>
            </View>

            {isOrganizer ? (
              <View style={styles.organizerMessageContainer}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#4B5563" />
                <Text style={styles.organizerMessage}>
                  Você é o organizador. Acompanhe o progresso dos pagamentos aqui.
                </Text>
              </View>
            ) : (
              <>
                {hasPaid ? (
                  <View style={styles.paidMessage}>
                    <Ionicons name="checkmark-circle" size={24} color="#34D399" />
                    <Text style={styles.paidMessageText}>
                      Você já pagou sua parte. Obrigado!
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.payShareButton}
                  onPress={() => setMostrarCheckout(true)}
                >
                  <MaterialCommunityIcons name="cash-plus" size={24} color="#FFF" />
                  <Text style={styles.payShareButtonText}>
                    {hasPaid ? 'Pagar novamente (teste)' : 'Pagar minha parte'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Lista de jogadores */}
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
        
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Sair da Sala</Text>
          </TouchableOpacity>
        </View>

        {/* Modal do Cofre (Checkout/Stripe) */}
        <CheckoutCofreModal
          visible={mostrarCheckout}
          onClose={() => {
            setMostrarCheckout(false);
          
            let tentativas = 0;
            const maxTentativas = 10;
            const intervaloMs = 3000;
          
            const intervalo = setInterval(async () => {
              tentativas++;
              console.log(`Iniciando tentativa de polling ${tentativas}/${maxTentativas}`);
          
              try {
                // 1) Carrega cofres novamente
                const resp = await api.get(`/api/jogador/reservas/${reservationId}/cofre`);
                setCofre(resp.data);
                console.log(`Cofre atual: valor_pago=${resp.data?.valor_pago}, valor_total=${resp.data?.valor_total}`);
              
                // 2) Atualiza jogadores (para ver se o usuário já pagou – hasPaid)
                const jogadoresResp = await api.get(`/api/lobby/${id_jogo}/jogadores`);
                if (jogadoresResp.data?.jogadores) {
                  const jogadores = jogadoresResp.data.jogadores;
                  const confirmados = jogadores.filter((j: Player) => j.status === 'ativo');
                  const espera = jogadores.filter((j: Player) => j.status === 'na_espera');
                  setConfirmedPlayers(confirmados);
                  setWaitingPlayers(espera);

                  // Verifica se o usuário atual já confirmou o pagamento
                  const eu = jogadores.find((j: Player) => j.id_usuario === userId);
                  const novoPagamentoStatus = eu?.pagamento_confirmado || false;
                  
                  console.log(`Status de pagamento anterior: ${hasPaid}, novo status: ${novoPagamentoStatus}`);
                  setHasPaid(novoPagamentoStatus);
                  
                  // Se o pagamento foi confirmado mas o cofre não atualizou, forçamos a atualização
                  if (novoPagamentoStatus && (!resp.data?.valor_pago || resp.data.valor_pago === 0)) {
                    console.log('Pagamento confirmado mas cofre não atualizado. Tentando atualizar o cofre manualmente...');
                    
                    // Calcular valor por jogador
                    const valorPorJogador = Math.round(quadraPreco / (gameDetails.limite_jogadores || confirmados.length));
                    
                    // Tenta forçar atualização do cofre com retry
                    let tentativasAtualizacao = 0;
                    const maxTentativasAtualizacao = 3;
                    let sucesso = false;
                    
                    while (!sucesso && tentativasAtualizacao < maxTentativasAtualizacao) {
                      tentativasAtualizacao++;
                      console.log(`Tentativa ${tentativasAtualizacao} de atualizar o cofre...`);
                      sucesso = await forcarAtualizacaoCofre(valorPorJogador);
                      
                      if (!sucesso && tentativasAtualizacao < maxTentativasAtualizacao) {
                        // Aguarda um pouco antes de tentar novamente
                        await new Promise(resolve => setTimeout(resolve, 1000));
                      }
                    }
                    
                    if (sucesso) {
                      console.log('Cofre atualizado com sucesso após forçar atualização');
                    } else {
                      console.log('Não foi possível atualizar o cofre após múltiplas tentativas');
                    }
                  }
                  
                  // Pare se o usuário já está marcado como tendo pago ou se atingiu tentativas máximas
                  if (novoPagamentoStatus || tentativas >= maxTentativas) {
                    console.log(`Finalizando polling: pagamento=${novoPagamentoStatus}, tentativas=${tentativas}`);
                    clearInterval(intervalo);
                    
                    // Atualiza o cofre uma última vez se o pagamento foi confirmado
                    if (novoPagamentoStatus) {
                      setTimeout(async () => {
                        const finalResp = await api.get(`/api/jogador/reservas/${reservationId}/cofre`);
                        setCofre(finalResp.data);
                        console.log('Atualização final do cofre:', finalResp.data);
                      }, 2000);
                    }
                  }
                }
              } catch (error) {
                console.error('Erro durante polling:', error);
              }
            }, intervaloMs);
          }}
          
          reservaId={reservationId}
          ownerId={ownerId}
          amount={quadraPreco}
          id_usuario={userId}
          quantidadeJogadores={gameDetails.limite_jogadores || confirmedPlayers.length}
          onPaymentSuccess={forcarAtualizacaoCofre}
          forcarAtualizacaoStatusJogador={forcarAtualizacaoStatusJogador}
          registrarTransacao={registrarTransacao}
        />

        {/* Adicionar o modal de convite de amigos */}
        <InviteFriendsModal
          visible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteFriends}
          gameId={id_jogo}
          userId={userId}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA' 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666',
    fontFamily: 'Poppins-Medium'
  },
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  contentContainer: { 
    paddingTop: 0, 
    paddingBottom: 24 
  },
  orangeCard: {
    backgroundColor: '#FF6B00',
    padding: 24,
    marginBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  gameName: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5
  },
  infoText: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: 16, 
    marginLeft: 8,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  gameInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  gameDetailsSection: { marginBottom: 16 },
  gameInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gameInfoText: { 
    fontSize: 16, 
    color: '#4B5563', 
    marginLeft: 12, 
    flex: 1,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  descriptionContainer: {
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16
  },
  descriptionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3
  },
  descriptionText: { 
    fontSize: 15, 
    color: '#4B5563', 
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2
  },
  pixContainer: { 
    backgroundColor: '#E6F0FF', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)'
  },
  pixHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pixTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#0066CC', 
    marginLeft: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3
  },
  pixText: { 
    fontSize: 16, 
    color: '#1E40AF',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
    marginTop: 8
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  idLabel: { fontSize: 14, color: '#4B5563' },
  idValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8
  },
  mainActionText: { 
    fontSize: 17, 
    fontWeight: '600', 
    color: '#FFF', 
    marginLeft: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2
  },
  organizerActions: { 
    marginTop: 24,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  organizerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)'
  },
  organizerActionsTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#374151', 
    marginLeft: 12,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3
  },
  organizerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  organizerCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    flex: 1,
  
  },
  organizerCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  organizerCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3,
    textAlign: 'center'
  },
  organizerCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2,
    textAlign: 'center'
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9F5',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5'
  },
  notifyButtonText: { fontSize: 14, fontWeight: '600', color: '#FF6B00', marginLeft: 8 },
  reservationStatusCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },
  reservationStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reservationStatusTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginLeft: 12,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3
  },
  reservationStatusMessage: { 
    fontSize: 16, 
    color: '#4B5563', 
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2,
    marginTop: 8
  },
  paymentCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  paymentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  paymentTitleContainer: {
    flex: 1
  },
  paymentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2
  },
  paymentAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  paymentAmountInfo: {
    flex: 1
  },
  paymentAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B00',
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5,
    marginVertical: 4
  },
  paymentPerPlayer: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  paymentProgressInfo: {
    alignItems: 'flex-end'
  },
  paymentProgressText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  paymentProgressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2,
    marginTop: 4
  },
  progressBarContainer: {
    marginBottom: 24
  },
  progressBackground: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 8
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  paymentDetailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24
  },
  paymentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  paymentDetailsItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12
  },
  paymentDetailsLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
    marginTop: 8,
    marginBottom: 4
  },
  paymentDetailsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3
  },
  organizerMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  organizerMessage: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  paidMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 95, 70, 0.1)'
  },
  paidMessageText: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  payShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  payShareButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2
  },
  playersSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  tabsContainer: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF',
    paddingHorizontal: 20
  },
  tab: { 
    flex: 1, 
    paddingVertical: 16, 
    alignItems: 'center' 
  },
  activeTab: { 
    borderBottomWidth: 3, 
    borderBottomColor: '#FF6B00' 
  },
  tabText: { 
    fontSize: 16, 
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2
  },
  activeTabText: { 
    color: '#FF6B00', 
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2
  },
  playersListContainer: { 
    padding: 24, 
    minHeight: 200 
  },
  playerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  playerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerAvatar: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  playerInitial: { fontSize: 18, fontWeight: 'bold' },
  playerInfo: { flex: 1, justifyContent: 'center' },
  playerName: { 
    fontSize: 17, 
    fontWeight: '600', 
    color: '#1F2937', 
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3
  },
  playerStatusBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1
  },
  playerStatusText: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 48 
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#4B5563', 
    marginTop: 20, 
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3
  },
  emptySubtitle: { 
    fontSize: 16, 
    color: '#6B7280', 
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2,
    lineHeight: 24
  },
});

export default LiveRoomScreen; 
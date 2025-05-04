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
  import CofreActions from '../components/cofre/CofreActions';
  import PagamentoStripe from '../components/PagamentoStripe';
  import CheckoutCofreModal from '../components/CheckoutCofreModal';

  const { width } = Dimensions.get('window');

  const STATUS_COLORS = {
    'aprovada': '#34D399',
    'pendente': '#F59E0B',
    'rejeitada': '#EF4444',
    'aberto': '#34D399',
    'em andamento': '#3B82F6',
    'balanceando times': '#F59E0B',
    'cancelado': '#9CA3AF',
  };

  const STATUS_ICONS = {
    'aprovada': 'check-circle',
    'pendente': 'time',
    'rejeitada': 'close-circle',
    'aberto': 'check-circle',
    'em andamento': 'play',
    'balanceando times': 'people',
    'cancelado': 'close',
  };

  // Função para registrar transação
  async function registrarTransacao({
    id_reserva,
    id_usuario,
    payment_intent_id,
    valor_total,
    valor_repasse,
    taxa_jogatta
  }) {
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
    } catch (error) {
      console.error('❌ Erro ao registrar transação:', error.response?.data || error.message);
      throw error; // Propaga o erro para ser tratado pelo chamador
    }
  }

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

    // Estados de pagamento e reserva
    const [reservationStatus, setReservationStatus] = useState('pendente');
    const [statusMessage, setStatusMessage] = useState('');
    const [reservationId, setReservationId] = useState(null);
    const [hasPaid, setHasPaid] = useState(false);
    const [ownerId, setOwnerId] = useState(null);
    const [quadraPreco, setQuadraPreco] = useState(0);

    // Cofre
    const [cofre, setCofre] = useState(null);

    // Modal de checkout
    const [mostrarCheckout, setMostrarCheckout] = useState(false);

    // Função para forçar atualização do cofre
    const forcarAtualizacaoCofre = async (valorPorJogador) => {
      if (!reservationId) return false;
      
      try {
        console.log('Forçando atualização do cofre com valor:', valorPorJogador);
        
        // Tenta atualizar o cofre
        const response = await api.post('/api/jogador/reservas/pagar', {
          reserva_id: reservationId,
          valor_pago: valorPorJogador,
          id_usuario: userId,
          force_update: true,
          is_test: true // Indica que é um pagamento de teste
        });
        
        console.log('Resposta da atualização forçada:', response.data);
        
        // Atualiza o estado do cofre
        const cofreResponse = await api.get(`/api/jogador/reservas/${reservationId}/cofre`);
        if (cofreResponse.data) {
          console.log('Novo estado do cofre:', cofreResponse.data);
          setCofre(cofreResponse.data);
        }
        
        // Atualiza também os dados dos jogadores para refletir o novo pagamento
        await carregarJogadores();
        
        return true;
      } catch (error) {
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

    // Função para atualizar diretamente o status do jogador
    const forcarAtualizacaoStatusJogador = async () => {
      if (!id_jogo || !userId) return false;
      
      console.log('===> Forçando atualização do status do jogador <===');
      
      try {
        // Executa SQL diretamente para atualizar a tabela participacao_jogos
        console.log('Atualizando status do jogador:', {
          id_jogo,
          id_usuario: userId
        });
        
        const response = await api.post('/api/debug/execute-sql', {
          query: `UPDATE participacao_jogos 
                    SET pagamento_confirmado = TRUE, 
                        data_pagamento = NOW() 
                  WHERE id_jogo = $1 AND id_usuario = $2`,
          params: [id_jogo, userId]
        });
        
        console.log('Resposta da atualização de status:', response.data);
        
        // Recarregar jogadores para atualizar hasPaid
        await carregarJogadores();
        
        return true;
      } catch (error) {
        console.error('Erro ao atualizar status do jogador:', error);
        return false;
      }
    };

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
      } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do jogo.');
      }
    }, [id_jogo]);

    const carregarJogadores = useCallback(async () => {
      try {
        const response = await api.get(`/api/lobby/${id_jogo}/jogadores`);
        if (response.data) {
          const { jogadores } = response.data;
          const confirmados = jogadores.filter((j) => j.status === 'ativo');
          const espera = jogadores.filter((j) => j.status === 'na_espera');
          setConfirmedPlayers(confirmados);
          setWaitingPlayers(espera);

          // Verifica se o usuário atual já confirmou o pagamento
          const eu = jogadores.find((j) => j.id_usuario === userId);
          if (eu?.pagamento_confirmado) {
            setHasPaid(true);
          } else {
            setHasPaid(false);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        Alert.alert('Erro', 'Não foi possível carregar os jogadores.');
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    }, [id_jogo, userId]);

    const carregarStatusReserva = useCallback(async () => {
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
      } catch (error) {
        console.error('Erro ao carregar status da reserva:', error);
      }
    }, [id_jogo]);

    const carregarCofre = useCallback(async () => {
      if (!reservationId) return;
      try {
        const response = await api.get(`/api/jogador/reservas/${reservationId}/cofre`);
        console.log('Cofre atualizado:', response.data);
        if (response.data) {
          setCofre(response.data);
        }
      } catch (error) {
        console.error('Erro ao carregar cofre:', error);
      }
    }, [reservationId]);

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
          message: `Venha jogar vôlei comigo! Sala "${gameDetails.nome_jogo}" (ID: ${idNumerico})\nAcesse: ${linkSala}`,
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
        Alert.alert('Sucesso', 'Notificações enviadas!');
      } catch (error) {
        console.error('Erro ao notificar ausentes:', error);
        Alert.alert('Erro', 'Não foi possível notificar ausentes.');
      }
    };

    // onRefresh atualizado para recarregar todos os dados
    const onRefresh = useCallback(() => {
      setRefreshing(true);
      Promise.all([
        carregarDetalhes(),
        carregarJogadores(),
        carregarStatusReserva(),
        carregarCofre()
      ]).finally(() => setRefreshing(false));
    }, [carregarDetalhes, carregarJogadores, carregarStatusReserva, carregarCofre]);

    // Primeiro, carregamos o userId quando o id_jogo for definido
    useEffect(() => {
      if (id_jogo) {
        obterIdUsuario();
      }
    }, [id_jogo, obterIdUsuario]);

    // Carregamos detalhes e status da reserva somente quando o userId estiver disponível
    useEffect(() => {
      if (!userId) return;
      carregarDetalhes();
      carregarStatusReserva();
    }, [userId, carregarDetalhes, carregarStatusReserva]);

    // Garante que carregarCofre() e carregarJogadores() rodem somente quando reservationId e userId estiverem definidos
    useEffect(() => {
      if (reservationId && userId) {
        console.log('Carregando cofre com reservationId:', reservationId);
        carregarCofre();
        carregarJogadores();
      }
    }, [reservationId, userId, carregarCofre, carregarJogadores]);

    // Logs para debug do estado do cofre e do pagamento
    console.log('Estado do cofre no render:', cofre);
    console.log('hasPaid:', hasPaid);

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

    const renderPlayer = ({ item, index }) => {
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
                name={statusIcon} 
                size={16} 
                color="#FFF"
              />
              <Text style={styles.statusText}>
                {gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
              </Text>
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
                  <Text style={styles.notifyButtonText}>Notificar Ausentes</Text>
                </TouchableOpacity>
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
              <View style={styles.cofreHeader}>
                <View style={styles.cofreTitleContainer}>
                  <Text style={styles.cofreTitle}>Cofre da Partida</Text>
                 <Text style={styles.cofreProgress}>
  {Math.round(
    ((cofre?.valor_pago || 0) / 100 / (cofre?.valor_total || 1)) * 100
  )}%
</Text>

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
                      R$ {cofre?.valor_total != null ? parseFloat(cofre.valor_total).toFixed(2) : quadraPreco ? (quadraPreco / 100).toFixed(2) : '0.00'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cofreInfoContainer}>
                <View style={styles.cofreInfoRow}>
                  <View style={styles.cofreInfoItem}>
                    <Text style={styles.cofreInfoLabel}>Valor Total</Text>
                    <Text style={styles.cofreInfoValue}>
                    R$ {cofre?.valor_total != null 
  ? parseFloat(cofre.valor_total).toFixed(2)
  : quadraPreco ? (quadraPreco / 100).toFixed(2) : '0.00'}
                    </Text>
                  </View>
                  <View style={styles.cofreInfoItem}>
                    <Text style={styles.cofreInfoLabel}>Já Arrecadado</Text>
                    <Text style={styles.cofreInfoValue}>
                      R$ {cofre?.valor_pago != null ? (cofre.valor_pago / 100).toFixed(2) : '0.00'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cofreInfoRow}>
                  <View style={styles.cofreInfoItem}>
                    <Text style={styles.cofreInfoLabel}>Jogadores</Text>
                    <Text style={styles.cofreInfoValue}>{gameDetails.limite_jogadores || confirmedPlayers.length}</Text>
                  </View>
                  <View style={styles.cofreInfoItem}>
                    <Text style={styles.cofreInfoLabel}>Valor por Jogador</Text>
                    <Text style={styles.cofreInfoValue}>
                      R$ {quadraPreco ? (quadraPreco / (gameDetails.limite_jogadores || confirmedPlayers.length) / 100).toFixed(2) : '0.00'}
                    </Text>
                  </View>
                </View>
              </View>

              {isOrganizer ? (
                <Text style={styles.organizerMessage}>
                  Você é o organizador. Acompanhe o progresso dos pagamentos aqui.
                </Text>
              ) : (
                <>
                  {hasPaid ? (
                    <View style={styles.paidMessage}>
                      <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                      <Text style={styles.paidMessageText}>
                        Você já pagou sua parte. Obrigado!
                      </Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.payShareButton}
                    onPress={() => setMostrarCheckout(true)}
                  >
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
          
          <View style={{ height: 40 }} />

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
                    const confirmados = jogadores.filter((j) => j.status === 'ativo');
                    const espera = jogadores.filter((j) => j.status === 'na_espera');
                    setConfirmedPlayers(confirmados);
                    setWaitingPlayers(espera);

                    // Verifica se o usuário atual já confirmou o pagamento
                    const eu = jogadores.find((j) => j.id_usuario === userId);
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

        </ScrollView>
      </SafeAreaView>
    );
  };

  export default LiveRoomScreen;
  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    contentContainer: { paddingTop: 0, paddingBottom: 20 },

    /* Card Laranja */
    orangeCard: {
      backgroundColor: '#FF6B00',
      padding: 16,
      marginBottom: 10,
    },
    gameNameContainer: { marginBottom: 12 },
    gameName: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 2 },
    infoContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    infoItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
    infoText: { color: 'white', fontSize: 15, marginLeft: 6 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      alignSelf: 'flex-start'
    },
    statusText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

    /* Card com Detalhes do Jogo */
    gameInfoCard: {
      backgroundColor: '#FFF',
      borderRadius: 16,
      marginHorizontal: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2
    },
    gameDetailsSection: { marginBottom: 16 },
    gameInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    gameInfoText: { fontSize: 15, color: '#4B5563', marginLeft: 10, flex: 1 },
    descriptionContainer: {
      marginTop: 5,
      marginBottom: 16,
      backgroundColor: '#F9FAFB',
      padding: 12,
      borderRadius: 8
    },
    descriptionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
    descriptionText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
    pixContainer: { 
      backgroundColor: '#E6F0FF', 
      padding: 12, 
      borderRadius: 8, 
      marginBottom: 16 
    },
    pixHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    pixTitle: { fontSize: 15, fontWeight: '600', color: '#0066CC', marginLeft: 6 },
    pixText: { fontSize: 15, color: '#1E40AF', marginBottom: 8 },
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
      paddingVertical: 12,
      borderRadius: 8
    },
    mainActionText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
    organizerActions: { marginTop: 10 },
    organizerActionsTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    actionButton: { flex: 1, marginHorizontal: 4, height: 44, borderRadius: 8, overflow: 'hidden' },
    actionButtonDisabled: { opacity: 0.7 },
    actionButtonGradient: { 
      flex: 1, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingHorizontal: 12 
    },
    actionButtonText: { color: '#FFF', fontWeight: '600', marginLeft: 6 },
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

    /* Status da Reserva */
    reservationStatusCard: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 10,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4
    },
    reservationStatusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    reservationStatusTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
    reservationStatusMessage: { fontSize: 14, color: '#4B5563', lineHeight: 20 },

    /* Card do Cofre/Pagamento */
    paymentCard: {
      marginHorizontal: 16,
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1
    },
    cofreHeader: {
      marginBottom: 20,
    },
    cofreTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cofreTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827'
    },
    cofreProgress: {
      fontSize: 16,
      fontWeight: '600',
      color: '#059669'
    },
    progressBarContainer: {
      marginBottom: 4,
    },
    progressBackground: {
      height: 12,
      backgroundColor: '#E5E7EB',
      borderRadius: 6,
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#34D399',
      borderRadius: 6,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    progressLabel: {
      fontSize: 12,
      color: '#6B7280',
    },
    cofreInfoContainer: {
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    cofreInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    cofreInfoItem: {
      flex: 1,
      alignItems: 'center',
    },
    cofreInfoLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 4,
    },
    cofreInfoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
    },
    organizerMessage: {
      color: '#4B5563',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },
    paidMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F0FDF4',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    paidMessageText: {
      color: '#065F46',
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
    payShareButton: {
      backgroundColor: '#FF6B00',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center'
    },
    payShareButtonText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '600'
    },

    /* Lista de Jogadores e Tabs */
    playersSection: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: '#FFF',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
      elevation: 2
    },
    tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#FF6B00' },
    tabText: { fontSize: 14, color: '#6B7280' },
    activeTabText: { color: '#FF6B00', fontWeight: '600' },
    playersListContainer: { padding: 16, minHeight: 200 },
    playerCard: {
      backgroundColor: '#FFF',
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    playerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    playerAvatar: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    playerInitial: { fontSize: 18, fontWeight: 'bold' },
    playerInfo: { flex: 1, justifyContent: 'center' },
    playerName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
    playerStatusBadge: { 
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1
    },
    playerStatusText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 30 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginTop: 12, marginBottom: 4 },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  });


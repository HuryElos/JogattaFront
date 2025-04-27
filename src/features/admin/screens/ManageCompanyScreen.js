import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Linking,           // ⬅️ adicionado
  Button             // ⬅️ adicionado
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import api from '../../../services/api';
import CompanyContext from '../../../contexts/CompanyContext';
import AuthContext from '../../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function ManageCompanyScreen({ route, navigation }) {
  const { company, setCompany } = useContext(CompanyContext);
  const { logout } = useContext(AuthContext);

  const [quadras, setQuadras]               = useState([]);
  const [reservasPendentes, setReservasPendentes] = useState([]);
  const [companyData, setCompanyData]       = useState(null);
  const [loading, setLoading]               = useState(true);
  const [loadingReservas, setLoadingReservas]     = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedDate, setSelectedDate]     = useState(0);
  const [loadingStripe, setLoadingStripe]   = useState(false);  // ⬅️ adicionado

  /* ─────────────────────────────── BUSCA DA EMPRESA ─────────────────────────────── */
  useEffect(() => {
    const fetchEmpresaDoUsuario = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado');
        const { id: idUsuario } = jwtDecode(token);
        const { data } = await api.get(`/api/empresas/usuario/${idUsuario}`);
        if (!data?.id_empresa) throw new Error('Nenhuma empresa vinculada');
        setCompany(data);
        setCompanyData(data);
      } catch (err) {
        Alert.alert('Erro', err.message || 'Falha ao buscar empresa do usuário.');
      } finally {
        setLoading(false);
      }
    };

    if (route.params?.company) {
      setCompanyData(route.params.company);
      setCompany?.(route.params.company);
      setLoading(false);
    } else if (company) {
      setCompanyData(company);
      setLoading(false);
    } else {
      fetchEmpresaDoUsuario();
    }
  }, [company, route.params?.company]);

  const empresaAtual = companyData || company;

  /* ─────────────────────────────── QUADRAS & RESERVAS ─────────────────────────────── */
  const fetchQuadrasDaEmpresa = useCallback(async () => {
    if (!empresaAtual?.id_empresa) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/empresas/${empresaAtual.id_empresa}/quadras`);
      setQuadras(data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar as quadras da empresa.');
    } finally {
      setLoading(false);
    }
  }, [empresaAtual?.id_empresa]);

  const fetchReservasPendentes = useCallback(async () => {
    if (!empresaAtual?.id_empresa) return;
    setLoadingReservas(true);
    try {
      const { data } = await api.get(
        `/api/empresas/reservas/${empresaAtual.id_empresa}/reservas`,
        { params: { status: 'pendente' } }
      );
      setReservasPendentes(data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar as reservas pendentes.');
    } finally {
      setLoadingReservas(false);
    }
  }, [empresaAtual?.id_empresa]);

  /* ─────────────────────────────── REFRESH ─────────────────────────────── */
  const onRefresh = useCallback(() => {
    if (!empresaAtual) return;
    setRefreshing(true);
    Promise.all([fetchQuadrasDaEmpresa(), fetchReservasPendentes()]).finally(() =>
      setRefreshing(false)
    );
  }, [empresaAtual, fetchQuadrasDaEmpresa, fetchReservasPendentes]);

  useEffect(() => {
    if (empresaAtual?.id_empresa) {
      (async () => {
        await Promise.allSettled([fetchQuadrasDaEmpresa(), fetchReservasPendentes()]);
      })();
    }
  }, [fetchQuadrasDaEmpresa, fetchReservasPendentes, empresaAtual?.id_empresa]);

  /* ─────────────────────────────── HANDLERS RESERVA ─────────────────────────────── */
  const handleConfirmReserva = async (id_reserva, id_jogo) => {
    try {
      await api.put(`/api/jogador/reservas/${id_reserva}/status`, {
        status: 'aprovada',
        id_jogo
      });
      Alert.alert('Sucesso', 'Reserva confirmada!');
      fetchReservasPendentes();
    } catch {
      Alert.alert('Erro', 'Falha ao confirmar a reserva.');
    }
  };

  const handleRejectReserva = async (id_reserva, id_jogo) => {
    try {
      await api.put(`/api/jogador/reservas/${id_reserva}/status`, {
        status: 'rejeitada',
        id_jogo
      });
      Alert.alert('Sucesso', 'Reserva rejeitada!');
      fetchReservasPendentes();
    } catch {
      Alert.alert('Erro', 'Falha ao rejeitar a reserva.');
    }
  };

  /* ─────────────────────────────── STRIPE ONBOARDING ─────────────────────────────── */
  const handleOnboardingStripe = async () => {
    setLoadingStripe(true);
    try {
      const { data } = await api.post('/api/connect/create-account-link', {
        id_empresa: empresaAtual.id_empresa
      });
      if (data?.url) {
        Linking.openURL(data.url);
      } else {
        Alert.alert('Erro', 'Link de onboarding não fornecido.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar o onboarding com o Stripe.');
    } finally {
      setLoadingStripe(false);
    }
  };

  /* ─────────────────────────────── ESTADOS DE INTERFACE ─────────────────────────────── */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7014" />
        <Text style={styles.loadingText}>Carregando dados da empresa...</Text>
      </View>
    );
  }

  if (!empresaAtual) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#CBD5E0" />
        <Text style={styles.emptyText}>Nenhuma empresa encontrada.</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.navigate('AuthStack')}
        >
          <Text style={styles.goBackButtonText}>Voltar para login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ─────────────────────────────── AUXILIARES DE DATA ─────────────────────────────── */
  const today         = new Date();
  const capitalize    = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const todayString   = `${today.getDate()} de ${capitalize(
    today.toLocaleDateString('pt-BR', { month: 'long' })
  )}`;
  const diasSemana    = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dias          = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { dia: diasSemana[d.getDay()], data: d.getDate() };
  });

  /* ─────────────────────────────── RENDERIZAÇÕES ─────────────────────────────── */
  const renderReservaCard = (item, index) => {
    const valorReserva = item.valor && !isNaN(Number(item.valor))
      ? Number(item.valor).toFixed(2).replace('.', ',')
      : '200,00';

    return (
      <View key={index} style={styles.reservaCardContainer}>
        <View style={styles.reservaCardTop}>
          <View style={styles.reservaIcon}>
            <MaterialCommunityIcons name="soccer-field" size={24} color="#49454F" />
          </View>
          <View style={styles.reservaMainContent}>
            <Text style={styles.reservaTitulo}>{item.nome_jogo || 'Partida 1'}</Text>
            <View style={styles.inlineRow}>
              <View style={styles.reservaOrganizadorRow}>
                <Icon name="user" size={14} color="#666" />
                <Text style={styles.reservaOrganizador}>
                  {item.organizador || 'Organizador não informado'}
                </Text>
                <Text style={styles.reservaPonto}> • </Text>
              </View>
              <View style={styles.reservaHorarioRow}>
                <Icon name="clock-o" size={14} color="black" />
                <Text style={styles.reservaHorario}>
                  {item.horario_inicio && item.horario_fim
                    ? `${item.horario_inicio.slice(0,5)} - ${item.horario_fim.slice(0,5)}`
                    : '13:00 - 18:00'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.reservaRightContent}>
            <Text style={styles.reservaPreco}>R$ {valorReserva}</Text>
            <Text style={styles.reservaDia}>Hoje</Text>
          </View>
        </View>
        <View style={styles.reservaActions}>
          <TouchableOpacity
            style={[styles.reservaActionButton, styles.recusarButton]}
            onPress={() => handleRejectReserva(item.id_reserva, item.id_jogo)}
          >
            <Text style={styles.reservaActionButtonText}>Recusar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reservaActionButton, styles.aceitarButton]}
            onPress={() => handleConfirmReserva(item.id_reserva, item.id_jogo)}
          >
            <Text style={styles.reservaActionButtonText}>Aceitar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQuadraCard = (quadra, idx) => {
    const precoHora = quadra.preco_hora && !isNaN(Number(quadra.preco_hora))
      ? Number(quadra.preco_hora).toFixed(2).replace('.', ',')
      : '20,00';

    return (
      <View key={idx} style={styles.quadraCard}>
        <View style={styles.quadraHeader}>
          <MaterialCommunityIcons name="soccer-field" size={30} color="#49454F" />
          <Text style={styles.quadraTag}>
            {quadra.rede_disponivel && quadra.bola_disponivel
              ? 'Rede e bola'
              : quadra.rede_disponivel
              ? 'Rede'
              : quadra.bola_disponivel
              ? 'Bola'
              : 'Sem extras'}
          </Text>
        </View>
        <Text style={styles.quadraTitulo}>{quadra.nome || `Quadra ${idx + 1}`}</Text>
        <View style={styles.quadraLinha} />
        <View style={styles.quadraInfo}>
          <View style={styles.quadraInfoRow}>
            <Text style={styles.reservaPonto}> • </Text>
            <Text style={styles.quadraInfoText}>R$ {precoHora}/hora</Text>
          </View>
          <View style={styles.quadraInfoRow}>
            <Text style={styles.reservaPonto}> • </Text>
            <Text style={styles.quadraInfoText}>
              {quadra.capacidade ? `Até ${quadra.capacidade} pessoas` : 'Até 30 pessoas'}
            </Text>
          </View>
          <Text style={styles.quadraInfoText}>
            Aberto: {(quadra.hora_abertura || '13:00').slice(0,5)} - {(quadra.hora_fechamento || '18:00').slice(0,5)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editarQuadraButton}
          onPress={() => navigation.navigate('GerenciarQuadra', { quadra })}
        >
          <Text style={styles.editarQuadraText}>Editar quadra</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /* ─────────────────────────────── LAYOUT ─────────────────────────────── */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerGreeting}>
          Olá, {empresaAtual.nome?.split(' ')[0] || 'mariagabi'}!
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="search" size={22} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="bell" size={22} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIcon, { marginLeft: 20 }]}
            onPress={() => {
              logout();
              navigation.navigate('AuthStack');
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF7014" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF7014']}
            tintColor="#FF7014"
          />
        }
      >
        {/* BOTÃO GENÉRICO DE CONFIG PAGAMENTOS */}
        <View style={{ margin: 20 }}>
          <Button
            title="Configurar Conta para Receber Pagamentos"
            onPress={() => navigation.navigate('OnboardingNavigator')}
          />
        </View>

        {/* BANNER PENDENTE DE APROVAÇÃO */}
        {empresaAtual.status === 'pendente' && (
          <View style={styles.pendingBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.pendingBannerText}>
              Sua empresa ainda está pendente de aprovação. Você pode cadastrar quadras, mas elas só estarão visíveis aos jogadores após aprovação.
            </Text>
          </View>
        )}

        {/* BOTÃO DE ONBOARDING STRIPE */}
        {empresaAtual.stripe_onboarding_completo === false && (
          <TouchableOpacity
            style={styles.stripeButton}
            onPress={handleOnboardingStripe}
            disabled={loadingStripe}
          >
            {loadingStripe ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.stripeButtonText}>Finalizar cadastro com Stripe</Text>
            )}
          </TouchableOpacity>
        )}

        {/* DASHBOARD */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardCardHeader}>
            <Text style={styles.dashboardDate}>Hoje, {todayString}</Text>
            <TouchableOpacity style={styles.calender}>
              <Feather name="calendar" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.diasContainer}>
            {dias.map((diaObj, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.diaBox, selectedDate === i && styles.diaBoxSelected]}
                onPress={() => setSelectedDate(i)}
              >
                <Text style={[styles.diaLabel, selectedDate === i && styles.diaLabelSelected]}>
                  {diaObj.dia}
                </Text>
                <Text style={[styles.diaData, selectedDate === i && styles.diaDataSelected]}>
                  {diaObj.data}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardLarge]}>
              <Text style={styles.statValue}>{reservasPendentes.length}</Text>
              <Text style={styles.statLabel}>Reservas hoje</Text>
            </View>
            <View style={styles.statsColumnRight}>
              <View style={[styles.statCard, styles.statCardSmall]}>
                <View style={styles.statCardInner}>
                  <Text style={styles.statValue}>25%</Text>
                  <Text style={styles.statLabel}>Ocupação</Text>
                </View>
                <MaterialCommunityIcons name="chart-pie" size={20} color="#000" />
              </View>
              <View style={[styles.statCard, styles.statCardSmall]}>
                <View style={styles.statCardInner}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Quadras disponíveis</Text>
                </View>
                <MaterialCommunityIcons name="soccer-field" size={20} color="#000" />
              </View>
            </View>
          </View>
        </View>

        {/* SOLICITAÇÕES DE RESERVA */}
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Solicitações de reserva</Text>
                <TouchableOpacity>
                  <Text style={styles.sectionLink}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              {loadingReservas ? (
                <ActivityIndicator size="small" color="#FF7014" />
              ) : reservasPendentes.length ? (
                reservasPendentes.map((r, idx) => renderReservaCard(r, idx))
              ) : (
                <Text style={styles.noDataText}>Nenhuma reserva pendente</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* MINHAS QUADRAS */}
        <View style={styles.sectionMinhasQuadras}>
          <Text style={styles.sectionTitle}>Minhas quadras</Text>
          <TouchableOpacity
            style={styles.novaQuadraButton}
            onPress={() => navigation.navigate('CreateQuadra', { companyId: empresaAtual.id_empresa })}
          >
            <Text style={styles.novaQuadraText}>+ Nova quadra</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {quadras.length ? (
            quadras.map((q, idx) => renderQuadraCard(q, idx))
          ) : (
            <View style={{ marginLeft: 20 }}>
              <Text style={styles.noDataText}>Nenhuma quadra cadastrada.</Text>
            </View>
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────── STYLES ─────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  /* ---- Loading & Empty ---- */
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { marginTop: 12, fontSize: 16, color: '#718096' },
  emptyText:        { fontSize: 16, color: '#718096', marginTop: 12 },
  goBackButton:     { marginTop: 24, backgroundColor: '#FF7014', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  goBackButtonText: { color: '#FFF', fontWeight: '600' },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'space-between'
  },
  headerGreeting: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  headerIcons:    { flexDirection: 'row', alignItems: 'center' },
  headerIcon:     { marginLeft: 16 },

  /* ---- Scroll Root ---- */
  scrollArea: { flex: 1, backgroundColor: '#FFFFFF' },

  /* ---- Pending Banner ---- */
  pendingBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9800', padding: 14, marginHorizontal: 20, borderRadius: 8, marginTop: 16, marginBottom: 12 },
  pendingBannerText: { flex: 1, color: '#FFF', fontSize: 15 },

  /* ---- Stripe Button ---- */
  stripeButton:     { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#EA610A', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  stripeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  /* ---- Dashboard ---- */
  dashboardCard: { marginHorizontal: 20, marginTop: 20, marginBottom: 24, padding: 18, backgroundColor: '#A3A1A69C', borderRadius: 16 },
  dashboardCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dashboardDate: { fontSize: 16, color: '#333333' },
  calender: { backgroundColor: '#D9D9D9', borderRadius: 50, height: 30, width: 30, justifyContent: 'center', alignItems: 'center' },

  diasContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  diaBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 50, backgroundColor: '#F0F0F0' },
  diaBoxSelected: { backgroundColor: '#EA610A' },
  diaLabel: { fontSize: 15, color: '#000', marginBottom: 2 },
  diaLabelSelected: { fontSize: 18, color: 'black', fontWeight: 'bold' },
  diaData: { fontSize: 20 },
  diaDataSelected: { color: 'black', fontSize: 22, fontWeight: 'bold' },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  statsColumnRight: { width: '48%', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#EA610A', borderRadius: 10, padding: 14, marginBottom: 8 },
  statCardLarge: { width: '48%', justifyContent: 'center', alignItems: 'center' },
  statCardSmall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  statCardInner: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 4 },
  statLabel: { fontSize: 13, color: 'black', opacity: 0.9 },

  /* ---- Sections ---- */
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionMinhasQuadras: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  sectionLink: { fontSize: 15, color: '#000', textDecorationLine: 'underline' },
  noDataText: { fontSize: 15, color: '#718096' },

  /* ---- Reservas ---- */
  reservaCardContainer: { backgroundColor: '#A3A1A69C', borderRadius: 15, padding: 16, marginBottom: 16 },
  reservaCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  reservaMainContent: { flex: 1 },
  reservaTitulo: { fontSize: 18, fontWeight: '600', color: '#000', marginTop: 30 },
  reservaOrganizadorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reservaOrganizador: { fontSize: 16, color: '#000' },
  reservaPonto: { fontSize: 30, color: 'black' },
  reservaHorarioRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reservaHorario: { fontSize: 14.5, color: 'black', fontWeight: '500' },
  reservaRightContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 70, gap: 10 },
  reservaPreco: { fontSize: 12, fontWeight: '500', color: '#000', backgroundColor: '#D9D9D9', borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12 },
  reservaDia: { fontSize: 12, color: '#000', fontWeight: '700', backgroundColor: '#D9D9D9', borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12 },
  reservaActions: { flexDirection: 'row', justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'black', paddingTop: 12, gap: 20 },
  reservaActionButton: { alignItems: 'center', borderRadius: 15, height: 25, width: 130 },
  recusarButton: { backgroundColor: '#B3261E' },
  aceitarButton: { backgroundColor: '#4D9E37' },
  reservaActionButtonText: { fontSize: 16, color: '#000' },

  /* ---- Quadras ---- */
  novaQuadraButton: { backgroundColor: '#EAEAEA', alignItems: 'center', borderRadius: 10, padding: 2, width: 130 },
  novaQuadraText: { fontSize: 14, color: '#000', fontWeight: 'bold' },
  horizontalScroll: { paddingLeft: 20 },

  quadraCard: { backgroundColor: '#A3A1A69C', borderRadius: 12, padding: 12, width: 200, height: 230, marginBottom: 30, marginRight: 20 },
  quadraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  quadraTag: { fontSize: 12, backgroundColor: '#D9D9D9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, color: 'black' },
  quadraTitulo: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  quadraLinha: { height: 1, backgroundColor: '#000', marginVertical: 1 },
  quadraInfo: { flexDirection: 'column' },
  quadraInfoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: -7 },
  quadraInfoText: { fontSize: 14.5, color: '#000', fontWeight: '500' },
  editarQuadraButton: { marginTop: 10, backgroundColor: '#D9D9D9', paddingVertical: 6, alignItems: 'center', borderRadius: 14 },
  editarQuadraText: { fontSize: 14, color: 'black' }
});

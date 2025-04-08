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
  Linking,
  Button
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import api from '../../../services/api';
import CompanyContext from '../../../contexts/CompanyContext';
import AuthContext from '../../../contexts/AuthContext';

// Importação do hook de navegação
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ManageCompanyScreen({ route, navigation }) {
  // Utilizando o hook de navegação (pode ser o mesmo objeto recebido via props)
  navigation = useNavigation();

  const { company, setCompany } = useContext(CompanyContext);
  const { logout } = useContext(AuthContext);

  const [quadras, setQuadras] = useState([]);
  const [reservasPendentes, setReservasPendentes] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);

  // ----------------------------
  // BUSCA DA EMPRESA
  // ----------------------------
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const idEmpresaParam = route.params?.company?.id_empresa ?? company?.id_empresa;
        if (!idEmpresaParam) {
          Alert.alert('Erro', 'Nenhuma empresa foi selecionada.');
          setLoading(false);
          return;
        }
        const response = await api.get(`/api/empresas/${idEmpresaParam}`);
        if (setCompany) setCompany(response.data);
        setCompanyData(response.data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível buscar os dados da empresa.');
      } finally {
        setLoading(false);
      }
    };

    const fetchEmpresaDoUsuario = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado');

        const decoded = jwtDecode(token);
        const idUsuario = decoded.id;
        const response = await api.get(`/api/empresas/usuario/${idUsuario}`);

        if (response.data && response.data.id_empresa) {
          setCompany(response.data);
          setCompanyData(response.data);
        } else {
          Alert.alert('Erro', 'Nenhuma empresa vinculada ao usuário.');
        }
      } catch (error) {
        Alert.alert('Erro', 'Falha ao buscar empresa do usuário.');
      } finally {
        setLoading(false);
      }
    };

    if (route.params?.company) {
      setCompanyData(route.params.company);
      if (setCompany) setCompany(route.params.company);
      setLoading(false);
    } else if (company) {
      setCompanyData(company);
      setLoading(false);
    } else {
      fetchEmpresaDoUsuario();
    }
  }, [company, route.params?.company]);

  const empresaAtual = companyData || company;

  // ----------------------------
  // BUSCAR QUADRAS E RESERVAS
  // ----------------------------
  const fetchQuadrasDaEmpresa = useCallback(async () => {
    if (!empresaAtual?.id_empresa) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/empresas/${empresaAtual.id_empresa}/quadras`);
      setQuadras(response.data || []);
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
      const response = await api.get(
        `/api/empresas/reservas/${empresaAtual.id_empresa}/reservas`,
        { params: { status: 'pendente' } }
      );
      setReservasPendentes(response.data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar as reservas pendentes.');
    } finally {
      setLoadingReservas(false);
    }
  }, [empresaAtual?.id_empresa]);

  // ----------------------------
  // REFRESH (pull-to-refresh)
  // ----------------------------
  const onRefresh = useCallback(() => {
    if (!empresaAtual) return;
    setRefreshing(true);
    Promise.all([fetchQuadrasDaEmpresa(), fetchReservasPendentes()]).finally(() =>
      setRefreshing(false)
    );
  }, [empresaAtual, fetchQuadrasDaEmpresa, fetchReservasPendentes]);

  // ----------------------------
  // CARREGAR DADOS QUANDO EMPRESA ESTÁ DISPONÍVEL
  // ----------------------------
  useEffect(() => {
    if (empresaAtual?.id_empresa) {
      (async () => {
        await Promise.allSettled([fetchQuadrasDaEmpresa(), fetchReservasPendentes()]);
      })();
    }
  }, [fetchQuadrasDaEmpresa, fetchReservasPendentes, empresaAtual?.id_empresa]);

  // ----------------------------
  // HANDLERS DE RESERVA
  // ----------------------------
  const handleConfirmReserva = async (id_reserva, id_jogo) => {
    try {
      await api.put(`/api/jogador/reservas/${id_reserva}/status`, {
        status: 'aprovada',
        id_jogo
      });
      Alert.alert('Sucesso', 'Reserva confirmada com sucesso!');
      fetchReservasPendentes();
    } catch {
      Alert.alert('Erro', 'Não foi possível confirmar a reserva.');
    }
  };

  const handleRejectReserva = async (id_reserva, id_jogo) => {
    try {
      await api.put(`/api/jogador/reservas/${id_reserva}/status`, {
        status: 'rejeitada',
        id_jogo
      });
      Alert.alert('Sucesso', 'Reserva rejeitada com sucesso!');
      fetchReservasPendentes();
    } catch {
      Alert.alert('Erro', 'Não foi possível rejeitar a reserva.');
    }
  };

  // ----------------------------
  // FUNÇÃO PARA ONBOARDING COM STRIPE
  // ----------------------------
  const [loadingStripe, setLoadingStripe] = useState(false);

  const handleOnboardingStripe = async () => {
    setLoadingStripe(true);
    try {
      const response = await api.post('/api/connect/create-account-link', {
        id_empresa: empresaAtual.id_empresa
      });
  
      const { url } = response.data;
      if (url) {
        Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Link de onboarding não retornado pelo servidor.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível iniciar o onboarding com o Stripe.');
    } finally {
      setLoadingStripe(false);
    }
  };

  // ----------------------------
  // TELAS DE LOADING OU EMPRESA NÃO ENCONTRADA
  // ----------------------------
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

  // ----------------------------
  // DADOS FIXOS PARA EXEMPLO
  // ----------------------------
  const todayString = '13 de maio';
  const reservasHoje = 10;
  const ocupacao = 25;
  const quadrasDisponiveis = 12;

  const dias = [
    { dia: 'Sex', data: 13 },
    { dia: 'Sáb', data: 14 },
    { dia: 'Dom', data: 15 },
    { dia: 'Seg', data: 16 },
    { dia: 'Ter', data: 17 }
  ];

  // ----------------------------
  // RENDERIZAÇÃO DA RESERVA (CARD)
  // ----------------------------
  const renderReservaCard = (item, index) => {
    // Converte o valor para número ou usa valor padrão
    const valorReserva = item.valor && !isNaN(Number(item.valor))
      ? Number(item.valor).toFixed(2).replace('.', ',')
      : '200,00';

    return (
      <View key={index} style={styles.reservaCardContainer}>
        <View style={styles.reservaCardTop}>
          <View style={styles.reservaIcon}>
            <MaterialCommunityIcons name="soccer-field" size={24} color="#000" />
          </View>
          <View style={styles.reservaMainContent}>
            <Text style={styles.reservaTitulo}>{item.nome_jogo || 'Partida 1'}</Text>
            <View style={styles.inlineRow}>
              <View style={styles.reservaOrganizadorRow}>
                <Icon name="user" size={14} color="#666" />
                <Text style={styles.reservaOrganizador}>
                  {item.organizador || 'Organizador não informado'}
                </Text>
              </View>
              <View style={styles.reservaHorarioRow}>
                <Icon name="clock-o" size={14} color="#666" />
                <Text style={styles.reservaHorario}>
                  {item.horario_inicio && item.horario_fim
                    ? `${item.horario_inicio} - ${item.horario_fim}`
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

  // ----------------------------
  // RENDERIZAÇÃO DE CADA QUADRA (CARD)
  // ----------------------------
  const renderQuadraCard = (quadra, index) => {
    // Converte o preço por hora para número ou usa padrão
    const precoHora = quadra.preco_hora && !isNaN(Number(quadra.preco_hora))
      ? Number(quadra.preco_hora).toFixed(2).replace('.', ',')
      : '20,00';

    return (
      <View key={index} style={styles.quadraCard}>
        <View style={styles.quadraHeader}>
          <MaterialCommunityIcons name="soccer-field" size={30} color="#000" />
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
        <Text style={styles.quadraTitulo}>{quadra.nome || `Quadra ${index + 1}`}</Text>
        <View style={styles.quadraLinha} />
        <Text style={styles.quadraInfo}>
          • R$ {precoHora}/hora
        </Text>
        <Text style={styles.quadraInfo}>
          • {quadra.capacidade ? `Até ${quadra.capacidade} pessoas` : 'Até 30 pessoas'}
        </Text>
        <Text style={styles.quadraInfo}>
          Funcionamento: {quadra.hora_abertura || '13:00'} - {quadra.hora_fechamento || '18:00'}
        </Text>
        <TouchableOpacity
          style={styles.editarQuadraButton}
          onPress={() => navigation.navigate('GerenciarQuadra', { quadra })}
        >
          <Text style={styles.editarQuadraText}>Editar quadra</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7014']} tintColor="#FF7014" />
        }
      >
        {/* Botão para Configurar Conta para Receber Pagamentos */}
        <View style={{ margin: 20 }}>
          <Button
            title="Configurar Conta para Receber Pagamentos"
            onPress={() => navigation.navigate('OnboardingNavigator')}
          />
        </View>

        {/* Banner de pendência */}
        {empresaAtual.status === 'pendente' && (
          <View style={styles.pendingBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.pendingBannerText}>
              Sua empresa ainda está pendente de aprovação. Você pode cadastrar quadras, mas elas só estarão visíveis aos jogadores após aprovação.
            </Text>
          </View>
        )}

        {/* Botão de onboarding com Stripe (visível se stripe_onboarding_completo for false) */}
        {empresaAtual.stripe_onboarding_completo === false && (
          <TouchableOpacity
            style={styles.stripeButton}
            onPress={handleOnboardingStripe}
            disabled={loadingStripe}
          >
            {loadingStripe ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.stripeButtonText}>
                Finalizar cadastro com Stripe
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* DASHBOARD CARD */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardCardHeader}>
            <Text style={styles.dashboardDate}>Hoje, {todayString}</Text>
            <TouchableOpacity>
              <Feather name="calendar" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.diasContainer}>
            {dias.map((diaObj, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.diaBox, selectedDate === index && styles.diaBoxSelected]}
                onPress={() => setSelectedDate(index)}
              >
                <Text style={[styles.diaLabel, selectedDate === index && styles.diaLabelSelected]}>
                  {diaObj.dia}
                </Text>
                <Text style={[styles.diaData, selectedDate === index && styles.diaDataSelected]}>
                  {diaObj.data}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardLarge]}>
              <Text style={styles.statValue}>{reservasHoje}</Text>
              <Text style={styles.statLabel}>Reservas hoje</Text>
            </View>
            <View style={styles.statsColumnRight}>
              <View style={[styles.statCard, styles.statCardSmall]}>
                <View style={styles.statCardInner}>
                  <Text style={styles.statValue}>{ocupacao}%</Text>
                  <Text style={styles.statLabel}>Ocupação</Text>
                </View>
                <MaterialCommunityIcons name="chart-pie" size={20} color="#FFF" />
              </View>
              <View style={[styles.statCard, styles.statCardSmall]}>
                <View style={styles.statCardInner}>
                  <Text style={styles.statValue}>{quadrasDisponiveis}</Text>
                  <Text style={styles.statLabel}>Quadras disponíveis</Text>
                </View>
                <MaterialCommunityIcons name="soccer-field" size={20} color="#FFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Solicitações de reserva */}
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
              ) : reservasPendentes.length > 0 ? (
                reservasPendentes.map((item, idx) => renderReservaCard(item, idx))
              ) : (
                <Text style={styles.noDataText}>
                  {reservasPendentes === null ? 'Erro ao carregar' : 'Nenhuma reserva pendente'}
                </Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Minhas quadras */}
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
          {quadras.length > 0 ? (
            quadras.map((quadra, index) => renderQuadraCard(quadra, index))
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096'
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12
  },
  goBackButton: {
    marginTop: 24,
    backgroundColor: '#FF7014',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  goBackButtonText: {
    color: '#FFF',
    fontWeight: '600'
  },
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
  headerGreeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000'
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIcon: {
    marginLeft: 16
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    padding: 14,
    marginHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 12
  },
  pendingBannerText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15
  },
  stripeButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#6772e5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  stripeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  dashboardCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 18,
    backgroundColor: '#FFE5D3',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  dashboardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  dashboardDate: {
    fontSize: 16,
    color: '#333'
  },
  diasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  diaBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
    borderRadius: 30,
    backgroundColor: '#FFF'
  },
  diaBoxSelected: {
    backgroundColor: '#FF7014'
  },
  diaLabel: {
    fontSize: 20,
    color: '#000',
    marginBottom: 2
  },
  diaLabelSelected: {
    color: 'black'
  },
  diaData: {
    fontSize: 25,
    fontWeight: 'bold'
  },
  diaDataSelected: {
    color: 'black'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statsColumnRight: {
    width: '48%',
    justifyContent: 'space-between'
  },
  statCard: {
    backgroundColor: '#FF7014',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8
  },
  statCardLarge: {
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  statCardInner: {
    flex: 1
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 13,
    color: 'black',
    opacity: 0.9
  },
  section: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionMinhasQuadras: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000'
  },
  sectionLink: {
    fontSize: 15,
    color: '#FF7014'
  },
  noDataText: {
    fontSize: 15,
    color: '#718096'
  },
  reservaCardContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16
  },
  reservaCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reservaIcon: {
    backgroundColor: 'transparent'
  },
  reservaIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  reservaMainContent: {
    flex: 1
  },
  reservaTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 30
  },
  reservaOrganizadorRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reservaOrganizador: {
    fontSize: 16,
    color: '#4A4A4A'
  },
  reservaHorarioRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reservaHorario: {
    fontSize: 14,
    color: 'black',
    fontWeight: '500'
  },
  reservaRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 70
  },
  reservaPreco: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    backgroundColor: '#BEBEBE',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  reservaDia: {
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: '700',
    backgroundColor: '#BEBEBE',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  reservaActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'black',
    paddingTop: 12
  },
  reservaActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 30,
    borderRadius: 15
  },
  recusarButton: {
    backgroundColor: '#D32F2F'
  },
  aceitarButton: {
    backgroundColor: '#388E3C'
  },
  reservaActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF'
  },
  novaQuadraButton: {
    backgroundColor: '#EAEAEA',
    padding: 8,
    borderRadius: 10
  },
  novaQuadraText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000'
  },
  horizontalScroll: {
    paddingLeft: 20
  },
  quadraCard: {
    backgroundColor: '#C4C4C4',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 190,
    marginBottom: 30
  },
  quadraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  quadraIcon: {
    width: 25,
    height: 25
  },
  quadraTag: {
    fontSize: 12,
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    color: '#000'
  },
  quadraTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
  },
  quadraLinha: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: 4
  },
  quadraInfo: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2
  },
  editarQuadraButton: {
    marginTop: 10,
    backgroundColor: '#D9D9D9',
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 4
  },
  editarQuadraText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold'
  }
});

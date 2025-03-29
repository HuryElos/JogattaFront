import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
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
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import api from '../../../services/api';
import CompanyContext from '../../../contexts/CompanyContext';
import AuthContext from '../../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function ManageCompanyScreen({ route, navigation }) {
  const { company, setCompany } = useContext(CompanyContext);
  const { logout } = useContext(AuthContext);

  const [quadras, setQuadras] = useState([]);
  const [reservasPendentes, setReservasPendentes] = useState([]);
  const [companyData, setCompanyData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);

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
  }, []);

  const empresaAtual = company || companyData;

  const fetchQuadrasDaEmpresa = async () => {
    if (!empresaAtual) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/empresas/${empresaAtual.id_empresa}/quadras`);
      setQuadras(response.data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar as quadras da empresa.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservasPendentes = async () => {
    if (!empresaAtual) return;
    setLoadingReservas(true);
    try {
      const response = await api.get(`/api/empresas/reservas/${empresaAtual.id_empresa}/reservas`, {
        params: { status: 'pendente' }
      });
      setReservasPendentes(response.data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar as reservas pendentes.');
    } finally {
      setLoadingReservas(false);
    }
  };

  const onRefresh = useCallback(() => {
    if (!empresaAtual) return;
    setRefreshing(true);
    Promise.all([
      fetchQuadrasDaEmpresa(),
      fetchReservasPendentes()
    ]).finally(() => setRefreshing(false));
  }, [empresaAtual]);

  useEffect(() => {
    if (empresaAtual) {
      fetchQuadrasDaEmpresa();
      fetchReservasPendentes();
    }
  }, [empresaAtual]);

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

  // Dados fixos para o layout
  const todayString = '13 de maio';
  const reservasHoje = 10;
  const ocupacao = 25;
  const quadrasDisponiveis = 12;

  // Dias
  const dias = [
    { dia: 'Sex', data: 13 },
    { dia: 'Sáb', data: 14 },
    { dia: 'Dom', data: 15 },
    { dia: 'Seg', data: 16 },
    { dia: 'Ter', data: 17 }
  ];

  const renderReservaCard = ({ item, index }) => (
    <View style={styles.reservaCard}>
      <View style={styles.reservaCardTop}>
        <View style={styles.reservaIcon}>
          <Text style={styles.reservaIconText}>Q{index + 1}</Text>
        </View>
        <View style={styles.reservaMainContent}>
          <Text style={styles.reservaTitulo}>{item.nome_jogo || 'Partida 1'}</Text>
          <View style={styles.reservaOrganizadorRow}>
            <MaterialCommunityIcons name="account" size={16} color="#666" />
            <Text style={styles.reservaOrganizador}>
              {item.organizador || 'Maria Burkhardt'}
            </Text>
          </View>
          <View style={styles.reservaHorarioRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
            <Text style={styles.reservaHorario}>
              {item.horario_inicio || '13:00'} - {item.horario_fim || '18:00'}
            </Text>
          </View>
        </View>
        <View style={styles.reservaRightContent}>
          <Text style={styles.reservaPreco}>R$ 200,00</Text>
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

  const renderQuadraCard = ({ item, index }) => (
    <View style={styles.quadraCard}>
      <View style={styles.quadraIcon}>
        <Text style={styles.quadraIconText}>Q{index + 1}</Text>
      </View>
      <Text style={styles.quadraCardTitle}>{item.nome || `Quadra ${index + 1}`}</Text>
      <Text style={styles.quadraCardInfo}>R$ {item.preco_hora || 200}/hora</Text>
      <Text style={styles.quadraCardInfo}>
        {item.capacidade ? `Até ${item.capacidade} pessoas` : 'N/A pessoas'}
      </Text>
      <Text style={styles.quadraCardInfo}>
        Funcionamento: {item.hora_abertura || '13:00'} - {item.hora_fechamento || '18:00'}
      </Text>
      <Text style={styles.quadraCardInfo}>
        {item.rede_disponivel && item.bola_disponivel
          ? 'Rede e bola'
          : item.rede_disponivel
          ? 'Rede'
          : item.bola_disponivel
          ? 'Bola'
          : 'Sem extras'}
      </Text>

      <TouchableOpacity
        style={styles.editarQuadraButton}
        onPress={() => navigation.navigate('GerenciarQuadra', { quadra: item })}
      >
        <Text style={styles.editarQuadraButtonText}>Editar quadra</Text>
      </TouchableOpacity>
    </View>
  );

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
        {/* Banner de pendência */}
        {empresaAtual.status === 'pendente' && (
          <View style={styles.pendingBanner}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={22}
              color="#FFF"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.pendingBannerText}>
              Sua empresa ainda está pendente de aprovação. Você pode cadastrar quadras, mas elas só estarão visíveis aos jogadores após aprovação.
            </Text>
          </View>
        )}

        {/* DASHBOARD CARD */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardCardHeader}>
            <Text style={styles.dashboardDate}>Hoje, {todayString}</Text>
            <TouchableOpacity>
              <Feather name="calendar" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Dias */}
          <View style={styles.diasContainer}>
            {dias.map((diaObj, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.diaBox,
                  selectedDate === index && styles.diaBoxSelected
                ]}
                onPress={() => setSelectedDate(index)}
              >
                <Text
                  style={[
                    styles.diaLabel,
                    selectedDate === index && styles.diaLabelSelected
                  ]}
                >
                  {diaObj.dia}
                </Text>
                <Text
                  style={[
                    styles.diaData,
                    selectedDate === index && styles.diaDataSelected
                  ]}
                >
                  {diaObj.data}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Estatísticas */}
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
                <TouchableOpacity>
                  <MaterialCommunityIcons name="dots-vertical" size={20} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={[styles.statCard, styles.statCardSmall]}>
                <View style={styles.statCardInner}>
                  <Text style={styles.statValue}>{quadrasDisponiveis}</Text>
                  <Text style={styles.statLabel}>Quadras disponíveis</Text>
                </View>
                <View
                  style={[
                    styles.quadraIcon,
                    { width: 22, height: 22, backgroundColor: '#DEDEDE', marginBottom: 0 }
                  ]}
                >
                  <Text style={[styles.quadraIconText, { fontSize: 11 }]}>Q</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Solicitações de reserva */}
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
            reservasPendentes.map((item, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                {renderReservaCard({ item, index })}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Nenhuma reserva pendente.</Text>
          )}
        </View>

        {/* Minhas quadras */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Minhas quadras</Text>
            <TouchableOpacity
              style={styles.novaQuadraButton}
              onPress={() => navigation.navigate('CreateQuadra', { companyId: empresaAtual.id_empresa })}
            >
              <Text style={styles.novaQuadraButtonText}>+ Nova quadra</Text>
            </TouchableOpacity>
          </View>

          {quadras.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {quadras.map((item, index) => (
                <View key={index} style={{ marginRight: 16 }}>
                  {renderQuadraCard({ item, index })}
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>Nenhuma quadra cadastrada.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container principal
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

  // Header
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

  // Área de scroll principal
  scrollArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },

  // Banner pendente
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

  // Dashboard card
  dashboardCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 18,
    backgroundColor: '#FFE5D3',
    borderRadius: 16
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

  // Dias
  diasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  diaBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 24,
    backgroundColor: '#FFF'
  },
  diaBoxSelected: {
    backgroundColor: '#FF7014'
  },
  diaLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  diaLabelSelected: {
    color: '#FFF'
  },
  diaData: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  diaDataSelected: {
    color: '#FFF'
  },

  // Estatísticas
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
    justifyContent: 'center'
  },
  statCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statCardInner: {
    flex: 1
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF'
  },
  statLabel: {
    fontSize: 13,
    color: '#FFF'
  },

  // Seções
  section: {
    marginHorizontal: 20,
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
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

  // Reservas
  reservaCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    overflow: 'hidden'
  },
  reservaCardTop: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center'
  },
  reservaIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#DEDEDE',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  reservaIconText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  reservaMainContent: {
    flex: 1
  },
  reservaTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000'
  },
  reservaOrganizadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  reservaOrganizador: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4
  },
  reservaHorarioRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reservaHorario: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4
  },
  reservaRightContent: {
    alignItems: 'flex-end'
  },
  reservaPreco: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000'
  },
  reservaDia: {
    fontSize: 12,
    color: '#FF7014',
    marginTop: 3
  },
  reservaActions: {
    flexDirection: 'row',
    height: 40
  },
  reservaActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recusarButton: {
    backgroundColor: '#EF4444'
  },
  aceitarButton: {
    backgroundColor: '#4CAF50'
  },
  reservaActionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14
  },

  // Minhas quadras
  novaQuadraButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  novaQuadraButtonText: {
    fontSize: 15,
    color: '#FF7014',
    fontWeight: '500'
  },
  quadraCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    minWidth: 150,
    maxWidth: width * 0.45,
    marginVertical: 4
  },
  quadraIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#DEDEDE',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  quadraIconText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000'
  },
  quadraCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000'
  },
  quadraCardInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  editarQuadraButton: {
    marginTop: 10,
    backgroundColor: '#DEDEDE',
    padding: 10,
    alignItems: 'center',
    borderRadius: 6
  },
  editarQuadraButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  }
});

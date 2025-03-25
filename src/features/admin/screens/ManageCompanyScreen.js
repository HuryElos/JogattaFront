import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import api from '../../../services/api';
import CompanyContext from '../../../contexts/CompanyContext';

const { width } = Dimensions.get('window');

export default function ManageCompanyScreen({ route, navigation }) {
  const { company, setCompany } = useContext(CompanyContext);
  const [quadras, setQuadras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservasPendentes, setReservasPendentes] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [companyData, setCompanyData] = useState(null);

  // --------------------------------------------------------
  // useEffect principal para buscar a empresa
  // --------------------------------------------------------
  useEffect(() => {
    console.log('[ManageCompanyScreen] useEffect iniciado');
    console.log('route.params?.company:', route.params?.company);
    console.log('company no contexto:', company);

    // Função para buscar empresa via ID (parâmetro ou contexto)
    const fetchCompanyData = async () => {
      try {
        const idEmpresaParam = route.params?.company?.id_empresa ?? company?.id_empresa;
        console.log('[fetchCompanyData] idEmpresaParam:', idEmpresaParam);

        if (!idEmpresaParam) {
          console.warn('[fetchCompanyData] Nenhum ID de empresa encontrado.');
          Alert.alert('Erro', 'Nenhuma empresa foi selecionada.');
          setLoading(false);
          return;
        }

        const response = await api.get(`/api/empresas/${idEmpresaParam}`);
        console.log('[fetchCompanyData] Dados recebidos:', response.data);

        if (setCompany) {
          setCompany(response.data);
        }
        setCompanyData(response.data);
      } catch (error) {
        console.error('[fetchCompanyData] Erro na requisição:', error?.response?.data || error.message);
        Alert.alert('Erro', 'Não foi possível buscar os dados da empresa.');
      } finally {
        setLoading(false);
      }
    };

    // Função para buscar empresa associada ao usuário logado (via token)
    const fetchEmpresaDoUsuario = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('[fetchEmpresaDoUsuario] Token recuperado:', token);

        if (!token) throw new Error('Token não encontrado');

        const decoded = jwtDecode(token);
        console.log('[fetchEmpresaDoUsuario] Token decodificado:', decoded);

        const idUsuario = decoded.id;
        console.log('[fetchEmpresaDoUsuario] idUsuario:', idUsuario);

        const response = await api.get(`/api/empresas/usuario/${idUsuario}`);
        console.log('[fetchEmpresaDoUsuario] Empresa encontrada:', response.data);

        if (response.data && response.data.id_empresa) {
          setCompany(response.data);
          setCompanyData(response.data);
        } else {
          console.warn('[fetchEmpresaDoUsuario] Nenhuma empresa vinculada ao usuário');
          Alert.alert('Erro', 'Nenhuma empresa vinculada ao usuário.');
        }
      } catch (error) {
        console.error('[fetchEmpresaDoUsuario] Erro:', error?.response?.data || error.message);
        Alert.alert('Erro', 'Falha ao buscar empresa do usuário.');
      } finally {
        setLoading(false);
      }
    };

    // Lógica principal do useEffect
    if (route.params?.company) {
      console.log('[useEffect] Usando empresa vinda por params');
      setCompanyData(route.params.company);
      if (setCompany) setCompany(route.params.company);
      setLoading(false);
    } else if (company) {
      console.log('[useEffect] Usando empresa do contexto');
      setCompanyData(company);
      setLoading(false);
    } else {
      console.log('[useEffect] Nenhuma empresa no contexto ou nos params. Buscando pelo usuário...');
      fetchEmpresaDoUsuario();
    }
  }, []);

  // Referência para a empresa atual (usa o dado do contexto ou do estado local)
  const empresaAtual = company || companyData;

  // --------------------------------------------------------
  // Funções para buscar quadras e reservas pendentes
  // --------------------------------------------------------
  const fetchQuadrasDaEmpresa = async () => {
    if (!empresaAtual) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/empresas/${empresaAtual.id_empresa}/quadras`);
      setQuadras(response.data || []);
    } catch (error) {
      console.log('Erro ao buscar quadras:', error?.response?.data || error.message);
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
    } catch (error) {
      console.log('Erro ao buscar reservas pendentes:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível buscar as reservas pendentes.');
    } finally {
      setLoadingReservas(false);
    }
  };

  // --------------------------------------------------------
  // Refresh
  // --------------------------------------------------------
  const onRefresh = useCallback(() => {
    if (!empresaAtual) return;

    setRefreshing(true);
    Promise.all([fetchQuadrasDaEmpresa(), fetchReservasPendentes()])
      .finally(() => setRefreshing(false));
  }, [empresaAtual]);

  // --------------------------------------------------------
  // useEffect para atualizar quadras e reservas assim que
  // a empresaAtual for definida
  // --------------------------------------------------------
  useEffect(() => {
    if (empresaAtual) {
      fetchQuadrasDaEmpresa();
      fetchReservasPendentes();
    }
  }, [empresaAtual]);

  // --------------------------------------------------------
  // Funções para confirmar/rejeitar reservas
  // --------------------------------------------------------
  const handleConfirmReserva = async (id_reserva, id_jogo) => {
    try {
      await api.put(`/api/jogador/reservas/${id_reserva}/status`, {
        status: 'aprovada',
        id_jogo: id_jogo
      });
      Alert.alert('Sucesso', 'Reserva confirmada com sucesso!');
      fetchReservasPendentes();
    } catch (error) {
      console.log('Erro ao confirmar reserva:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível confirmar a reserva. Tente novamente.');
    }
  };

  const handleRejectReserva = async (id_reserva, id_jogo) => {
    try {
      await api.put(`/api/jogador/reservas/${id_reserva}/status`, {
        status: 'rejeitada',
        id_jogo: id_jogo
      });
      Alert.alert('Sucesso', 'Reserva rejeitada com sucesso!');
      fetchReservasPendentes();
    } catch (error) {
      console.log('Erro ao rejeitar reserva:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível rejeitar a reserva. Tente novamente.');
    }
  };

  // --------------------------------------------------------
  // Renderizações
  // --------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.loadingContainerCenter}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando dados da empresa...</Text>
      </View>
    );
  }

  if (!empresaAtual) {
    return (
      <View style={styles.loadingContainerCenter}>
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

  const renderQuadraItem = ({ item }) => (
    <TouchableOpacity
      style={styles.quadraItem}
      onPress={() => navigation.navigate('GerenciarQuadra', { quadra: item })}
    >
      <View style={styles.quadraInfo}>
        <View style={styles.quadraHeader}>
          <MaterialCommunityIcons name="soccer-field" size={24} color="#4A90E2" />
          <Text style={styles.quadraName}>{item.nome}</Text>
        </View>
        <View style={styles.quadraDetails}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="currency-brl" size={16} color="#718096" />
            <Text style={styles.detailText}>R$ {item.preco_hora}/hora</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="account-group" size={16} color="#718096" />
            <Text style={styles.detailText}>{item.capacidade || 'N/A'} pessoas</Text>
          </View>
        </View>
        {item.promocao_ativa && (
          <View style={styles.promocaoContainer}>
            <MaterialCommunityIcons name="tag" size={16} color="#2ECC71" />
            <Text style={styles.promocaoText}>{item.descricao_promocao}</Text>
          </View>
        )}
        {item.hora_abertura && item.hora_fechamento && (
          <Text style={styles.disponibilidadeText}>
            Funcionamento: {item.hora_abertura} - {item.hora_fechamento}
          </Text>
        )}
      </View>
      <View style={styles.quadraActions}>
        <View style={styles.featuresContainer}>
          {item.rede_disponivel && (
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="wifi" size={16} color="#4A90E2" />
              <Text style={styles.featureText}>Rede</Text>
            </View>
          )}
          {item.bola_disponivel && (
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="soccer" size={16} color="#4A90E2" />
              <Text style={styles.featureText}>Bola</Text>
            </View>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E0" />
      </View>
    </TouchableOpacity>
  );

  const renderReservaItem = ({ item }) => (
    <View style={styles.reservaCard}>
      <Text style={styles.reservaTitulo}>{item.nome_jogo || 'Reserva'}</Text>
      <Text style={styles.reservaOrganizador}>Organizador: {item.organizador}</Text>
      <Text style={styles.reservaData}>
        {item.data_reserva} • {item.horario_inicio} - {item.horario_fim}
      </Text>
      {item.descricao && (
        <Text style={styles.reservaDescricao}>{item.descricao}</Text>
      )}
      <View style={styles.reservaAcoes}>
        <TouchableOpacity
          style={[styles.reservaButton, styles.confirmButton]}
          onPress={() => handleConfirmReserva(item.id_reserva, item.id_jogo)}
        >
          <Text style={styles.reservaButtonText}>Confirmar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reservaButton, styles.rejectButton]}
          onPress={() => handleRejectReserva(item.id_reserva, item.id_jogo)}
        >
          <Text style={styles.reservaButtonText}>Rejeitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --------------------------------------------------------
  // JSX principal
  // --------------------------------------------------------
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A91DA', '#37A0EC']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('AuthStack')}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.companyTitle}>{empresaAtual.nome}</Text>
            <Text style={styles.companySubtitle}>
              {empresaAtual.localizacao || empresaAtual.endereco}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2ECC71']}
            tintColor="#2ECC71"
            progressBackgroundColor="#FFF"
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="soccer-field" size={24} color="#4A90E2" />
              <Text style={styles.statValue}>{quadras.length}</Text>
              <Text style={styles.statLabel}>Quadras</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={24} color="#4A90E2" />
              <Text style={styles.statValue}>
                {quadras.reduce((acc, quadra) => acc + (quadra.capacidade || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Capacidade Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.quadrasSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quadras Disponíveis</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateQuadra', { companyId: empresaAtual.id_empresa })}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#2ECC71" />
              <Text style={styles.addButtonText}>Nova Quadra</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Carregando quadras...</Text>
            </View>
          ) : (
            <FlatList
              data={quadras}
              keyExtractor={(item) => String(item.id_quadra)}
              renderItem={renderQuadraItem}
              scrollEnabled={false}
              contentContainerStyle={styles.quadrasList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="soccer" size={48} color="#CBD5E0" />
                  <Text style={styles.emptyText}>Nenhuma quadra cadastrada</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.reservasSection}>
          <Text style={styles.sectionTitle}>Solicitações de Reserva</Text>
          {loadingReservas ? (
            <ActivityIndicator size="small" color="#4A90E2" />
          ) : reservasPendentes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma reserva pendente.</Text>
          ) : (
            <FlatList
              data={reservasPendentes}
              keyExtractor={(item) => String(item.id_reserva)}
              renderItem={renderReservaItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// --------------------------------------------------------
// Estilos
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  headerInfo: {
    flex: 1
  },
  companyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF'
  },
  companySubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4
  },
  content: {
    flex: 1
  },
  statsContainer: {
    padding: 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 8
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4
  },
  quadrasSection: {
    padding: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  addButtonText: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4
  },
  quadrasList: {
    paddingBottom: 16
  },
  quadraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  quadraInfo: {
    flex: 1
  },
  quadraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  quadraName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8
  },
  quadraDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailText: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 4
  },
  promocaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  promocaoText: {
    fontSize: 12,
    color: '#2ECC71',
    marginLeft: 4
  },
  disponibilidadeText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5
  },
  quadraActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 8
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  featureText: {
    fontSize: 12,
    color: '#4A90E2',
    marginLeft: 4
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40
  },
  loadingContainerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12
  },
  reservasSection: {
    padding: 16
  },
  reservaCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  reservaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  reservaOrganizador: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4
  },
  reservaData: {
    fontSize: 14,
    color: '#333',
    marginTop: 4
  },
  reservaDescricao: {
    fontSize: 14,
    color: '#333',
    marginTop: 8
  },
  reservaAcoes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12
  },
  reservaButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  confirmButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#EF4444'
  },
  reservaButtonText: {
    color: '#FFF',
    fontWeight: '600'
  },
  goBackButton: {
    marginTop: 24,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  goBackButtonText: {
    color: '#FFF',
    fontWeight: '600'
  }
});

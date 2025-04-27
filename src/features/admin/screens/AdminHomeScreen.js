import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { width } = Dimensions.get('window');

export default function AdminHomeScreen({ navigation }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [stats, setStats] = useState({
    totalEmpresas: 0,
    totalQuadras: 0,
    empresasAtivas: 0,
    empresasPendentes: 0,
    empresasInativas: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showNewCompanyBadge, setShowNewCompanyBadge] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  const { logout, user } = useContext(AuthContext);
  const notificationAnim = useRef(new Animated.Value(-100)).current;
  const updateButtonAnim = useRef(new Animated.Value(0)).current;
  const hideNotificationTimeout = useRef(null);
  const badgeAnim = useRef(new Animated.Value(0)).current;

  // Função para exibir notificação
  const displayNotification = () => {
    setShowNotification(true);
    setTimeout(() => {
      notificationAnim.setValue(-100);
      Animated.spring(notificationAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      if (hideNotificationTimeout.current) {
        clearTimeout(hideNotificationTimeout.current);
      }
      hideNotificationTimeout.current = setTimeout(() => {
        hideNotification();
      }, 5000);
    }, 100);
  };

  // Função para ocultar notificação
  const hideNotification = () => {
    if (hideNotificationTimeout.current) {
      clearTimeout(hideNotificationTimeout.current);
      hideNotificationTimeout.current = null;
    }
    Animated.spring(notificationAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start(() => {
      setShowNotification(false);
    });
  };

  const handleNotificationPress = () => {
    hideNotification();
  };

  const showUpdateButtonWithAnimation = () => {
    setShowUpdateButton(true);
    Animated.spring(updateButtonAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const hideUpdateButton = () => {
    Animated.spring(updateButtonAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start(() => setShowUpdateButton(false));
  };

  const showNewCompanyBadgeWithAnimation = () => {
    setShowNewCompanyBadge(true);
    Animated.sequence([
      Animated.spring(badgeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.delay(3000),
      Animated.spring(badgeAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start(() => setShowNewCompanyBadge(false));
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/empresas');
      // Para o admin, queremos exibir todas as empresas (ativo, pendente, inativo)
      const companiesData = response.data || [];
      setCompanies(companiesData);
      
      setStats({
        totalEmpresas: companiesData.length,
        totalQuadras: companiesData.reduce((acc, company) => acc + (company.quadras?.length || 0), 0),
        empresasAtivas: companiesData.filter(company => company.status === 'ativo').length,
        empresasPendentes: companiesData.filter(company => company.status === 'pendente').length,
        empresasInativas: companiesData.filter(company => company.status === 'inativo').length
      });
      hideUpdateButton();
    } catch (error) {
      console.log('Erro ao buscar empresas:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível buscar as empresas.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompanies().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(
        route => route.name === 'AdminHome'
      )?.params;
      
      if (params?.newCompanyAdded) {
        fetchCompanies();
        showNewCompanyBadgeWithAnimation();
        navigation.setParams({ newCompanyAdded: false });
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    return () => {
      if (hideNotificationTimeout.current) {
        clearTimeout(hideNotificationTimeout.current);
      }
    };
  }, []);

  // Função para aprovar empresa (muda status para ativo)
  const handleApproveCompany = async (id_empresa) => {
    try {
      const response = await api.patch(`/api/empresas/${id_empresa}/aprovar`);
      Alert.alert('Sucesso', 'Empresa aprovada com sucesso!');
      fetchCompanies();
    } catch (error) {
      console.error('Erro ao aprovar empresa:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível aprovar a empresa. Tente novamente.');
    }
  };

  // Função para filtrar empresas
  const filterCompanies = useCallback((companies, query) => {
    if (!query) return companies;
    
    const lowerQuery = query.toLowerCase();
    return companies.filter(company => {
      return (
        company.nome.toLowerCase().includes(lowerQuery) ||
        company.status.toLowerCase().includes(lowerQuery) ||
        company.endereco?.toLowerCase().includes(lowerQuery) ||
        company.contato?.toLowerCase().includes(lowerQuery) ||
        (company.quadras?.length || 0).toString().includes(lowerQuery)
      );
    });
  }, []);

  // Atualizar empresas filtradas quando mudar a lista ou a query
  useEffect(() => {
    setFilteredCompanies(filterCompanies(companies, searchQuery));
  }, [companies, searchQuery, filterCompanies]);

  const renderStatsCard = (title, value, icon, color) => (
    <View style={[styles.statsCard, { backgroundColor: color }]}>
      <View style={styles.statsIconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFF" />
      </View>
      <View style={styles.statsInfo}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderCompanyCard = ({ item }) => (
    <TouchableOpacity
      style={styles.companyCard}
      onPress={() => navigation.navigate('AdminCompanyDetails', { companyId: item.id_empresa })}
    >
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.companyCardGradient}
      >
        <View style={styles.companyHeader}>
          <View style={styles.companyLogoContainer}>
            <MaterialCommunityIcons name="office-building" size={32} color="#FFF" />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{item.nome}</Text>
            <Text style={styles.companyStatus}>
              {item.status === 'ativo'
                ? 'Ativo'
                : item.status === 'pendente'
                ? 'Pendente'
                : 'Inativa'}
            </Text>
          </View>
        </View>
        
        <View style={styles.companyDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#FFF" />
            <Text style={styles.detailText}>{item.endereco || 'Endereço não informado'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="phone" size={16} color="#FFF" />
            <Text style={styles.detailText}>{item.telefone || 'Telefone não informado'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="soccer-field" size={16} color="#FFF" />
            <Text style={styles.detailText}>{item.quadras?.length || 0} quadras</Text>
          </View>
        </View>

        {/* Se a empresa estiver pendente, exibe botão para aprovar */}
        {item.status === 'pendente' && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApproveCompany(item.id_empresa)}
          >
            <Text style={styles.approveButtonText}>Aprovar</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header com Gradiente */}
      <LinearGradient
        colors={['#1A91DA', '#37A0EC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Bem-vindo,</Text>
            <Text style={styles.adminName}>{user?.nome || 'Administrador'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateCompany')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Nova Empresa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={() => { logout(); navigation.navigate('AuthStack'); }}>
              <Ionicons name="log-out-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar empresas..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Notificação de Atualização */}
      {showNotification && (
        <Animated.View 
          style={[
            styles.notification,
            { transform: [{ translateY: notificationAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#2ECC71', '#27AE60']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.notificationGradient}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationIcon}>
                <MaterialCommunityIcons name="check-circle" size={22} color="#FFF" />
              </View>
              <TouchableOpacity 
                style={styles.notificationTextContainer}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Text style={styles.notificationText}>
                  Nova empresa adicionada com sucesso!
                </Text>
                <Text style={styles.notificationSubtext}>
                  Atualize a lista
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.notificationCloseButton}
                onPress={hideNotification}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Badge de Nova Empresa */}
      {showNewCompanyBadge && (
        <Animated.View 
          style={[
            styles.newCompanyBadge,
            {
              transform: [
                { translateY: badgeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0]
                })},
                { scale: badgeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 1, 0.8]
                }) }
              ],
              opacity: badgeAnim
            }
          ]}
        >
          <MaterialCommunityIcons name="check-circle" size={16} color="#FFF" />
          <Text style={styles.newCompanyBadgeText}>Nova empresa adicionada!</Text>
        </Animated.View>
      )}

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
        {/* Cards de Estatísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Visão Geral</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard('Total de Empresas', filteredCompanies.length, 'office-building', '#4A90E2')}
            {renderStatsCard('Total de Quadras', filteredCompanies.reduce((acc, company) => acc + (company.quadras?.length || 0), 0), 'soccer-field', '#2ECC71')}
            {renderStatsCard('Empresas Ativas', filteredCompanies.filter(company => company.status === 'ativo').length, 'check-circle', '#27AE60')}
            {renderStatsCard('Empresas Pendentes', filteredCompanies.filter(company => company.status === 'pendente').length, 'clock-outline', '#FACC15')}
            {renderStatsCard('Empresas Inativas', filteredCompanies.filter(company => company.status === 'inativo').length, 'close-circle', '#E74C3C')}
          </View>
        </View>

        {/* Lista de Empresas */}
        <View style={styles.companiesSection}>
          <Text style={styles.sectionTitle}>Empresas Parceiras</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#4A90E2" style={styles.loading} />
          ) : (
            <FlatList
              data={filteredCompanies}
              keyExtractor={(item) => String(item.id_empresa)}
              renderItem={renderCompanyCard}
              scrollEnabled={false}
              contentContainerStyle={styles.companiesList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="office-building-off" size={48} color="#CCC" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Botão de Atualização */}
      {showUpdateButton && (
        <Animated.View 
          style={[
            styles.updateButtonContainer,
            {
              transform: [
                { translateY: updateButtonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }
              ],
            }
          ]}
        >
          <TouchableOpacity
            style={styles.updateButton}
            onPress={fetchCompanies}
          >
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={styles.updateButtonGradient}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
              <Text style={styles.updateButtonText}>Atualizar Lista</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsInfo: {
    flex: 1,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statsTitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  companiesSection: {
    padding: 16,
  },
  companiesList: {
    paddingBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFF',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  companyCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyCardGradient: {
    padding: 16,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  companyStatus: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  companyDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  loading: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12,
  },
  notification: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    borderRadius: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  notificationGradient: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationTextContainer: {
    flex: 1,
    marginHorizontal: 4,
    padding: 4,
  },
  notificationText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  notificationSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  notificationCloseButton: {
    padding: 6,
    marginLeft: 8,
  },
  updateButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  updateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  newCompanyBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    backgroundColor: '#2ECC71',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  newCompanyBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  approveButton: {
    marginTop: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
});

export { AdminHomeScreen };

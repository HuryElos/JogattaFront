import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TextInput,
  ListRenderItem
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment';
import 'moment/locale/pt-br';
import api from '../services/api';

moment.locale('pt-br');

interface Partida {
  id_jogo: number;
  nome_jogo: string;
  status: PartidaStatus;
  status_reserva?: ReservaStatus;
  data_jogo: string;
  horario_inicio: string;
  horario_fim?: string;
  nome_quadra?: string;
  local?: string;
  jogadores_count?: number;
  limite_jogadores?: number;
}

type PartidaStatus = 'aberto' | 'balanceando times' | 'em andamento' | 'cancelado' | 'encerrado';
type ReservaStatus = 'pendente' | 'aprovada' | 'rejeitada';
type FilterType = 'todas' | 'proximas' | 'ativas' | 'concluidas';

type RootStackParamList = {
  PartidasScreen: undefined;
  LiveRoom: { id_jogo: number };
  JogosFlow: { screen: string };
};

type PartidasScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PartidasScreen'>;

interface PartidasScreenProps {
  navigation: PartidasScreenNavigationProp;
}

const STATUS_COLORS: Record<string, string> = {
  'pendente': '#F59E0B',
  'aprovada': '#34D399',
  'rejeitada': '#EF4444',
  'aberto': '#34D399',
  'balanceando times': '#F59E0B',
  'em andamento': '#3B82F6',
  'cancelado': '#9CA3AF',
  'encerrado': '#9CA3AF',
};

const STATUS_TEXTS: Record<string, string> = {
  'pendente': 'Aguardando aprovação',
  'aprovada': 'Reserva confirmada',
  'rejeitada': 'Reserva rejeitada',
  'aberto': 'Partida aberta',
  'balanceando times': 'Equilibrando times',
  'em andamento': 'Em andamento',
  'cancelado': 'Cancelado',
  'encerrado': 'Encerrado',
};

const PartidasScreen: React.FC<PartidasScreenProps> = ({ navigation }) => {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [filteredPartidas, setFilteredPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchPartidas = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.get('/api/lobby/me');
      if (response.status === 200 && Array.isArray(response.data.salas)) {
        const ordenadas = response.data.salas.sort((a: Partida, b: Partida) => {
          const dataA = moment(`${a.data_jogo}T${a.horario_inicio}`);
          const dataB = moment(`${b.data_jogo}T${b.horario_inicio}`);
          return dataA.diff(dataB);
        });
        
        setPartidas(ordenadas);
        setFilteredPartidas(ordenadas);
        applyFilter(activeFilter, ordenadas);
      }
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPartidas();
    }, [])
  );

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchPartidas();
  };

  const applyFilter = (filter: FilterType, partidasArray: Partida[] = partidas): void => {
    setActiveFilter(filter);
    
    let filtered = [...partidasArray];
    
    if (filter === 'proximas') {
      filtered = filtered.filter(p => 
        ['aberto', 'balanceando times', 'aprovada', 'pendente'].includes(p.status) ||
        (p.status_reserva && ['aprovada', 'pendente'].includes(p.status_reserva))
      );
    } else if (filter === 'ativas') {
      filtered = filtered.filter(p => 
        ['aberto', 'balanceando times', 'em andamento'].includes(p.status)
      );
    } else if (filter === 'concluidas') {
      filtered = filtered.filter(p => 
        ['encerrado', 'cancelado'].includes(p.status) ||
        (p.status_reserva && p.status_reserva === 'rejeitada')
      );
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.nome_jogo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nome_quadra && p.nome_quadra.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.local && p.local.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredPartidas(filtered);
  };

  const handleSearch = (text: string): void => {
    setSearchQuery(text);
    if (text.trim() === '') {
      applyFilter(activeFilter);
    } else {
      applyFilter(activeFilter, partidas);
    }
  };

  const renderPartidaItem: ListRenderItem<Partida> = ({ item }) => {
    const dataJogo = moment(`${item.data_jogo}T${item.horario_inicio}`);
    const isToday = dataJogo.isSame(moment(), 'day');
    const isPast = dataJogo.isBefore(moment(), 'day');
    
    const statusToShow = item.status_reserva || item.status;
    const statusColor = STATUS_COLORS[statusToShow] || '#9CA3AF';
    const statusText = STATUS_TEXTS[statusToShow] || statusToShow;

    return (
      <TouchableOpacity
        style={styles.partidaCard}
        onPress={() => navigation.navigate('LiveRoom', { id_jogo: item.id_jogo })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateChip}>
            <MaterialCommunityIcons name="calendar" size={14} color="#666" />
            <Text style={styles.dateChipText}>
              {isToday ? 'Hoje' : isPast ? 'Passada' : dataJogo.format('DD/MM')}
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <View style={styles.partidaContent}>
          <View style={styles.partidaIconContainer}>
            <MaterialCommunityIcons name="volleyball" size={24} color="#FF6B00" />
          </View>
          
          <View style={styles.partidaDetails}>
            <Text style={styles.partidaTitle} numberOfLines={1}>{item.nome_jogo || `Partida #${item.id_jogo}`}</Text>
            
            <View style={styles.partidaInfo}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
              <Text style={styles.partidaText}>
                {dataJogo.format('HH:mm')} 
                {item.horario_fim && ` - ${item.horario_fim.substring(0, 5)}`}
              </Text>
            </View>
            
            {(item.nome_quadra || item.local) && (
              <View style={styles.partidaInfo}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#666" />
                <Text style={styles.partidaText} numberOfLines={1}>
                  {item.nome_quadra || ''} {item.nome_quadra && item.local ? '• ' : ''} {item.local || ''}
                </Text>
              </View>
            )}
            
            <View style={styles.partidaInfo}>
              <MaterialCommunityIcons name="account-group-outline" size={16} color="#666" />
              <Text style={styles.partidaText}>
                {item.jogadores_count || 0}/{item.limite_jogadores || '--'} jogadores
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.accessButton}>
          <Text style={styles.accessButtonText}>Acessar</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = (): JSX.Element => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="volleyball" size={48} color="#CCC" />
      <Text style={styles.emptyText}>Nenhuma partida encontrada</Text>
      <Text style={styles.emptySubtext}>
        Crie uma nova partida ou participe de uma existente
      </Text>
    </View>
  );

  const renderFilterButton = (filter: FilterType, label: string): JSX.Element => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => applyFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        activeFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Partidas</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('JogosFlow', { screen: 'CriarJogo' })}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#666666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar partidas..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('todas', 'Todas')}
        {renderFilterButton('proximas', 'Próximas')}
        {renderFilterButton('ativas', 'Ativas')}
        {renderFilterButton('concluidas', 'Concluídas')}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#FF6B00" />
      ) : (
        <FlatList
          data={filteredPartidas}
          renderItem={renderPartidaItem}
          keyExtractor={(item) => item.id_jogo.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B00']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#FF6B00',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 20,
    marginTop: 0,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B00',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  partidaCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateChipText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  partidaContent: {
    flexDirection: 'row',
  },
  partidaIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF5EB',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partidaDetails: {
    flex: 1,
  },
  partidaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  partidaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  partidaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 12,
  },
  accessButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default PartidasScreen; 
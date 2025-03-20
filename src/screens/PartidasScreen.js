// src/screens/PartidasScreen.js

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
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import 'moment/locale/pt-br';
import api from '../services/api';

moment.locale('pt-br');

const STATUS_COLORS = {
  'pendente': '#F59E0B',    // Amarelo (reserva pendente)
  'aprovada': '#34D399',    // Verde (reserva aprovada)
  'rejeitada': '#EF4444',   // Vermelho (reserva rejeitada)
  'aberto': '#34D399',      // Verde (jogo aberto)
  'balanceando times': '#F59E0B', // Amarelo (balanceando times)
  'em andamento': '#3B82F6', // Azul (em andamento)
  'cancelado': '#9CA3AF',    // Cinza (cancelado)
  'encerrado': '#9CA3AF',    // Cinza (encerrado)
};

const STATUS_TEXTS = {
  'pendente': 'Aguardando aprovação',
  'aprovada': 'Reserva confirmada',
  'rejeitada': 'Reserva rejeitada',
  'aberto': 'Partida aberta',
  'balanceando times': 'Equilibrando times',
  'em andamento': 'Em andamento',
  'cancelado': 'Cancelado',
  'encerrado': 'Encerrado',
};

const PartidasScreen = ({ navigation }) => {
  const [partidas, setPartidas] = useState([]);
  const [filteredPartidas, setFilteredPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPartidas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/lobby/me');
      if (response.status === 200 && Array.isArray(response.data.salas)) {
        // Ordenando por data/hora (próximas primeiro)
        const ordenadas = response.data.salas.sort((a, b) => {
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchPartidas();
  };

  const applyFilter = (filter, partidasArray = partidas) => {
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
    
    // Aplica busca por texto, se houver
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.nome_jogo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nome_quadra && p.nome_quadra.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.local && p.local.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredPartidas(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      applyFilter(activeFilter);
    } else {
      applyFilter(activeFilter, partidas);
    }
  };

  const renderPartidaItem = ({ item }) => {
    const dataJogo = moment(`${item.data_jogo}T${item.horario_inicio}`);
    const isToday = dataJogo.isSame(moment(), 'day');
    const isPast = dataJogo.isBefore(moment(), 'day');
    
    // Verifica qual status mostrar (prioriza status_reserva se existir)
    const statusToShow = item.status_reserva || item.status;
    const statusColor = STATUS_COLORS[statusToShow] || '#9CA3AF';
    const statusText = STATUS_TEXTS[statusToShow] || statusToShow;

    return (
      <TouchableOpacity
        style={styles.partidaCard}
        onPress={() => navigation.navigate('LiveRoom', { id_jogo: item.id_jogo })}
      >
        {/* Tag de data/status no canto superior */}
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
        
        {/* Conteúdo principal */}
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

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../assets/icons/sports_volleyball.png')} 
        style={{ width: 64, height: 64, opacity: 0.5, marginBottom: 16 }}
      />
      <Text style={styles.emptyTitle}>Nenhuma partida encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'todas' 
          ? 'Você ainda não está em nenhuma partida.' 
          : `Não há partidas na categoria "${activeFilter}".`}
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('JogosFlow', { screen: 'CriarJogo' })}
      >
        <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
        <Text style={styles.createButtonText}>Criar Nova Partida</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas Partidas</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar partidas por nome ou local..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'todas' && styles.activeFilterTab]}
            onPress={() => applyFilter('todas')}
          >
            <Text style={[styles.filterText, activeFilter === 'todas' && styles.activeFilterText]}>
              Todas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'proximas' && styles.activeFilterTab]}
            onPress={() => applyFilter('proximas')}
          >
            <Text style={[styles.filterText, activeFilter === 'proximas' && styles.activeFilterText]}>
              Próximas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'ativas' && styles.activeFilterTab]}
            onPress={() => applyFilter('ativas')}
          >
            <Text style={[styles.filterText, activeFilter === 'ativas' && styles.activeFilterText]}>
              Ativas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'concluidas' && styles.activeFilterTab]}
            onPress={() => applyFilter('concluidas')}
          >
            <Text style={[styles.filterText, activeFilter === 'concluidas' && styles.activeFilterText]}>
              Concluídas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Partidas */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Carregando partidas...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPartidas}
            renderItem={renderPartidaItem}
            keyExtractor={(item) => item.id_jogo.toString()}
            contentContainerStyle={styles.partidasList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF6B00']}
                tintColor="#FF6B00"
              />
            }
            ListEmptyComponent={renderEmptyList}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        )}

        {/* Botão flutuante para criar nova partida */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate('JogosFlow', { screen: 'CriarJogo' })}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 25,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: '#FF6B00',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#FF6B00',
    fontWeight: '600',
  },
  partidasList: {
    paddingHorizontal: 16,
  },
  partidaCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  dateChipText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  partidaContent: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 16,
  },
  partidaIconContainer: {
    backgroundColor: '#FFF9F5',
    width: 40,
    height: 40,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  partidaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  partidaText: {
    fontSize: 14,
    color: '#666',
  },
  accessButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  accessButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default PartidasScreen;
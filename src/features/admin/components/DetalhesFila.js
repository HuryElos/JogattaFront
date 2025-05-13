import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DetalhesFila = ({ route, navigation }) => {
  const { quadra } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [interessados, setInteressados] = useState([]);

  // Mock data para teste
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        nome: "João Silva",
        telefone: "5511999999999",
        data_entrada: "2024-03-20T14:30:00",
        tamanho_grupo: 8,
        pagantes: 5,
        valor_arrecadado: 250.00
      },
      {
        id: 2,
        nome: "Maria Santos",
        telefone: "5511988888888",
        data_entrada: "2024-03-20T15:00:00",
        tamanho_grupo: 6,
        pagantes: 3,
        valor_arrecadado: 150.00
      },
      {
        id: 3,
        nome: "Pedro Oliveira",
        telefone: "5511977777777",
        data_entrada: "2024-03-20T15:30:00",
        tamanho_grupo: 10,
        pagantes: 7,
        valor_arrecadado: 350.00
      }
    ];

    setInteressados(mockData);
    setLoading(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Aqui você faria a chamada real à API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleWhatsApp = (telefone) => {
    const url = `https://wa.me/${telefone}`;
    Linking.openURL(url);
  };

  const formatarTempoEspera = (dataEntrada) => {
    return formatDistanceToNow(new Date(dataEntrada), {
      locale: ptBR,
      addSuffix: true
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7014" />
        <Text style={styles.loadingText}>Carregando detalhes da fila...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF7014']}
          tintColor="#FF7014"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Fila de Espera – {quadra.nome}</Text>
      </View>

      {interessados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>Nenhum interessado no momento.</Text>
        </View>
      ) : (
        interessados.map((interessado) => (
          <View key={interessado.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.nome}>{interessado.nome}</Text>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => handleWhatsApp(interessado.telefone)}
              >
                <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Entrou {formatarTempoEspera(interessado.data_entrada)}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tamanho do Grupo</Text>
                <Text style={styles.statValue}>{interessado.tamanho_grupo} pessoas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Pagantes</Text>
                <Text style={styles.statValue}>{interessado.pagantes} pessoas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Valor Arrecadado</Text>
                <Text style={styles.statValue}>R$ {interessado.valor_arrecadado.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  whatsappButton: {
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
});

export default DetalhesFila; 
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
import { MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DetalhesFilaScreen({ route, navigation }) {
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
        data_entrada: new Date().toISOString(), // Data atual para teste
        tamanho_grupo: 8,
        pagantes: 5,
        valor_arrecadado: 250.00
      },
      {
        id: 2,
        nome: "Maria Santos",
        telefone: "5511988888888",
        data_entrada: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        tamanho_grupo: 6,
        pagantes: 3,
        valor_arrecadado: 150.00
      },
      {
        id: 3,
        nome: "Pedro Oliveira",
        telefone: "5511977777777",
        data_entrada: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutos atrás
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

  const handleCall = (telefone) => {
    const url = `tel:${telefone}`;
    Linking.openURL(url);
  };

  const formatarTempoEspera = (dataEntrada) => {
    const now = new Date();
    const entrada = new Date(dataEntrada);
    const diffInMinutes = Math.floor((now - entrada) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffInMinutes < 60) {
      return `Entrou há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `Entrou há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    }
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
        <Text style={styles.title}>Fila de Espera da Quadra</Text>
      </View>

      {interessados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group" size={48} color="#CBD5E0" />
          <Text style={styles.emptyText}>Nenhum interessado no momento.</Text>
        </View>
      ) : (
        interessados.map((interessado, index) => (
          <View key={interessado.id} style={styles.card}>
            <View style={styles.positionContainer}>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{index + 1}º</Text>
              </View>
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.nome}>{interessado.nome}</Text>
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={[styles.contactButton, styles.whatsappButton]}
                  onPress={() => handleWhatsApp(interessado.telefone)}
                >
                  <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactButton, styles.callButton]}
                  onPress={() => handleCall(interessado.telefone)}
                >
                  <FontAwesome name="phone" size={20} color="#FF7014" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {formatarTempoEspera(interessado.data_entrada)}
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
}

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
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  contactButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  whatsappButton: {
    backgroundColor: '#E8F5E9',
  },
  callButton: {
    backgroundColor: '#FFF3E0',
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
  positionContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
    zIndex: 1,
  },
  positionBadge: {
    backgroundColor: '#FF7014',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  positionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
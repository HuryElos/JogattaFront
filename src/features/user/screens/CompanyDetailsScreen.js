// src/features/user/screens/CompanyDetailsScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  TouchableOpacity
} from 'react-native';
import api from '../../../services/api';

export default function CompanyDetailsScreen({ route, navigation }) {
  const { id_empresa } = route.params; // Recebe o ID da empresa

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      // GET /api/empresas/:id
      const response = await api.get(`/api/empresas/${id_empresa}`);
      setCompany(response.data);
    } catch (error) {
      console.log('Erro ao buscar empresa:', error.message);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da empresa.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Empresa não encontrada.</Text>
      </View>
    );
  }

  // Renderizar cada quadra da empresa com os novos campos
  const renderQuadraItem = ({ item }) => (
    <View style={styles.quadraCard}>
      {/* Título e preço lado a lado */}
      <View style={styles.quadraHeader}>
        <Text style={styles.quadraName}>{item.nome}</Text>
        <Text style={styles.quadraPrice}>R$ {item.preco_hora}</Text>
      </View>

      {/* Foto clicável, se existir. Se não existir, exibe fallback */}
      {item.foto ? (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('QuadraPhotoScreen', { photoUrl: item.foto })
          }
        >
          <Image
            source={{ uri: item.foto }}
            style={styles.quadraPhoto}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : (
        <Image
          source={{ uri: 'https://picsum.photos/400/300' }}
          style={styles.quadraPhoto}
          resizeMode="cover"
        />
      )}

      {/* Promoção, se ativa */}
      {item.promocao_ativa && (
        <Text style={styles.promocaoText}>
          Promoção: {item.descricao_promocao}
        </Text>
      )}

      {/* Rede e bola */}
      <Text style={styles.infoText}>
        Rede Disponível: {item.rede_disponivel ? 'Sim' : 'Não'}
      </Text>
      <Text style={styles.infoText}>
        Bola Disponível: {item.bola_disponivel ? 'Sim' : 'Não'}
      </Text>

      {/* Observações, se houver */}
      {item.observacoes && (
        <Text style={styles.infoText}>Observações: {item.observacoes}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header com logo da empresa e nome */}
      <View style={styles.header}>
        {company.logo_url ? (
          <Image source={{ uri: company.logo_url }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder} />
        )}
        <Text style={styles.title}>{company.nome}</Text>
      </View>

      {/* Dados básicos da empresa */}
      <Text style={styles.info}>
        Localização: {company.endereco || company.localizacao}
      </Text>
      <Text style={styles.info}>Contato: {company.contato}</Text>

      {/* Lista de quadras */}
      <Text style={styles.sectionTitle}>Quadras da Empresa</Text>
      {company.quadras && company.quadras.length > 0 ? (
        <FlatList
          data={company.quadras}
          keyExtractor={(quadra) => String(quadra.id_quadra)}
          renderItem={renderQuadraItem}
          style={{ marginTop: 10 }}
        />
      ) : (
        <Text style={styles.info}>Nenhuma quadra cadastrada.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20, backgroundColor: '#FFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold' },

  // Info
  info: { fontSize: 14, marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },

  // Card de quadra
  quadraCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,

    // Sombras para Android e iOS
    elevation: 3, // Android
    shadowColor: '#000', // iOS
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quadraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quadraName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  quadraPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
  quadraPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
  },
  promocaoText: {
    marginTop: 4,
    color: '#E67E22',
    fontWeight: '600',
  },
  infoText: {
    marginTop: 4,
    color: '#555',
  },
});

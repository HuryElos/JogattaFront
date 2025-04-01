import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';

const { width } = Dimensions.get('window');

export default function ExploreQuadrasScreen({ navigation }) {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/empresas?includeQuadras=true');
      // Exibe apenas empresas ativas
      setCompanies(response.data.filter(company => company.status === 'ativo') || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CompanyDetails', { id_empresa: item.id_empresa })}
      activeOpacity={0.9}
    >
      {item.logo_url ? (
        <Image
          source={{ uri: item.logo_url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#FF7014', '#FF8A3D']}
          style={styles.placeholderImage}
        >
          <Ionicons name="tablet-landscape-outline" size={28} color="#FFF" />
        </LinearGradient>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <View
          style={[
            styles.badgeContainer,
            item.quadras?.length > 0 ? styles.activeBadge : styles.inactiveBadge
          ]}
        >
          <Ionicons name="basketball" size={14} color="#FFF" />
          <Text style={styles.badgeText}>
            {item.quadras?.length || 0} Quadras
          </Text>
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#37A0EC" />
      
      <View style={styles.mainContainer}>
        <LinearGradient
          colors={['#1A91DA', '#37A0EC', '#59B0FA']}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explorar Quadras</Text>
          <View style={styles.placeholderView} />
        </LinearGradient>

        <View style={styles.contentContainer}>
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                placeholder="Buscar empresa..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Empresas Disponíveis</Text>
            {loading && <ActivityIndicator size="small" color="#37A0EC" />}
          </View>
        
          <FlatList
            data={filteredCompanies}
            keyExtractor={(item) => item.id_empresa.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyState}>
                  <Ionicons name="basketball" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>
                    {search.length > 0 
                      ? `Nenhuma empresa encontrada para "${search}"`
                      : "Nenhuma empresa disponível no momento"
                    }
                  </Text>
                </View>
              )
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderView: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 15,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -15,
  },
  searchWrapper: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  cardImage: {
    width: 55,
    height: 55,
    borderRadius: 12,
  },
  placeholderImage: {
    width: 55,
    height: 55,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#34D399',
  },
  inactiveBadge: {
    backgroundColor: '#9CA3AF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export { ExploreQuadrasScreen };

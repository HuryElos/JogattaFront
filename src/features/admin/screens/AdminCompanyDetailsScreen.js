import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AuthContext from '../../../contexts/AuthContext';
import api from '../../../services/api';

export default function AdminCompanyDetailsScreen({ route, navigation }) {
  const { companyId } = route.params; // Recebido do AdminHomeScreen
  const { user } = useContext(AuthContext);

  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Buscar dados completos da empresa (incluindo Stripe e dados bancários)
  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/empresas/${companyId}`);
      console.log('Resposta da API (detalhes da empresa):', response.data);
      setCompanyData(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes da empresa:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível carregar os dados da empresa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  // Função para aprovar a empresa, se estiver pendente
  const handleApprove = async () => {
    try {
      await api.patch(`/api/empresas/${companyId}/aprovar`);
      Alert.alert('Sucesso', 'Empresa aprovada com sucesso!');
      fetchCompanyDetails();
      // Opcional: navigation.goBack();
    } catch (error) {
      console.error('Erro ao aprovar empresa:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível aprovar a empresa.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!companyData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Não há dados para exibir.</Text>
      </View>
    );
  }

  const { empresa, stripe_status, bank_accounts } = companyData;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A91DA', '#37A0EC']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Detalhes da Empresa</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dados da Empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados da Empresa</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="office-building" size={20} color="#333" />
            <Text style={styles.infoText}>{empresa?.nome || 'Nome não informado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#333" />
            <Text style={styles.infoText}>CNPJ: {empresa?.cnpj || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#333" />
            <Text style={styles.infoText}>Endereço: {empresa?.endereco || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone" size={20} color="#333" />
            <Text style={styles.infoText}>Telefone: {empresa?.contato || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#333" />
            <Text style={styles.infoText}>E-mail: {empresa?.email_empresa || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#333" />
            <Text style={styles.infoText}>Status: {empresa?.status}</Text>
          </View>
        </View>

        {/* Status Stripe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Stripe</Text>
          {stripe_status ? (
            <>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="cash-check" size={20} color="#333" />
                <Text style={styles.infoText}>
                  Pagamentos (charges_enabled): {stripe_status.charges_enabled ? 'Ativo' : 'Desativado'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="bank-transfer-out" size={20} color="#333" />
                <Text style={styles.infoText}>
                  Repasse (payouts_enabled): {stripe_status.payouts_enabled ? 'Habilitado' : 'Desabilitado'}
                </Text>
              </View>
              {stripe_status.requirements && stripe_status.requirements.currently_due?.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Requisitos pendentes:</Text>
                  {stripe_status.requirements.currently_due.map((req, index) => (
                    <Text key={index} style={styles.requirementItem}>
                      - {req}
                    </Text>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.infoText}>Nenhuma informação de Stripe disponível.</Text>
          )}
        </View>

        {/* Dados Bancários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Bancários</Text>
          {bank_accounts && bank_accounts.length > 0 ? (
            bank_accounts.map((bank, idx) => (
              <View key={bank.id} style={styles.bankItem}>
                <Text style={styles.bankTitle}>Conta {idx + 1}</Text>
                <Text style={styles.bankInfo}>Banco: {bank.bank_name}</Text>
                <Text style={styles.bankInfo}>Agência: {bank.routing_number}</Text>
                <Text style={styles.bankInfo}>Conta: {bank.last4 && `***${bank.last4}`}</Text>
                <Text style={styles.bankInfo}>Titular: {bank.account_holder_name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.infoText}>Nenhuma conta bancária cadastrada.</Text>
          )}
        </View>

        {/* Botão de Aprovação (se status pendente) */}
        {empresa?.status === 'pendente' && (
          <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
            <Text style={styles.approveButtonText}>Aprovar Empresa</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2D3748',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  requirementsContainer: {
    marginTop: 8,
  },
  requirementsTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementItem: {
    marginLeft: 8,
    color: '#333',
  },
  bankItem: {
    backgroundColor: '#F0F4F8',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  bankTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  bankInfo: {
    color: '#555',
    fontSize: 14,
    marginBottom: 2,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { AdminCompanyDetailsScreen };

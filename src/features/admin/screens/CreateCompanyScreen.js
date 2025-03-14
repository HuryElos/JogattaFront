import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Platform, ScrollView,
  Dimensions, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../services/api';

const { width } = Dimensions.get('window');

export default function CreateCompanyScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [contato, setContato] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!nome.trim()) {
      return Alert.alert('Atenção', 'O nome da empresa é obrigatório.');
    }

    setLoading(true);
    try {
      const payload = { nome, localizacao, contato };
      const response = await api.post('/api/empresas', payload);

      if (response.status === 201) {
        // Seta o parâmetro para que a tela de Admin saiba que uma nova empresa foi cadastrada
        navigation.setParams({ newCompanyAdded: true });
        Alert.alert('Sucesso', 'Empresa cadastrada com sucesso!');
        navigation.goBack();
      } else {
        Alert.alert('Erro', 'Não foi possível criar a empresa.');
      }
    } catch (error) {
      console.log('Erro ao criar empresa:', error?.response?.data || error.message);
      Alert.alert('Erro', error?.response?.data?.message || 'Não foi possível criar a empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header com Gradiente */}
      <LinearGradient
        colors={['#1A91DA', '#37A0EC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Empresa</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <MaterialCommunityIcons name="office-building" size={24} color="#4A90E2" />
              <Text style={styles.inputLabel}>Informações Básicas</Text>
            </View>
            
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="office-building-cog" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome da Empresa"
                value={nome}
                onChangeText={setNome}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Localização"
                value={localizacao}
                onChangeText={setLocalizacao}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="phone" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contato"
                value={contato}
                onChangeText={setContato}
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
                  <Text style={styles.submitButtonText}>Cadastrar Empresa</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

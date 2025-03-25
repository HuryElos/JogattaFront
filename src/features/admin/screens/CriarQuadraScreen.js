import React, { useState } from 'react';
import {
  View, Text, TextInput, Switch,
  TouchableOpacity, StyleSheet, Alert, Image,
  ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../services/api';
import DateTimeButton from '../../jogos/components/DateTimeButton';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';

export default function CriarQuadraScreen({ route, navigation }) {
  const { companyId } = route.params;
  const [nome, setNome] = useState('');
  const [foto, setFoto] = useState(null);
  const [precoHora, setPrecoHora] = useState('');
  const [promocaoAtiva, setPromocaoAtiva] = useState(false);
  const [descricaoPromocao, setDescricaoPromocao] = useState('');
  const [redeDisponivel, setRedeDisponivel] = useState(false);
  const [bolaDisponivel, setBolaDisponivel] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [capacidade, setCapacidade] = useState('');

  // Novos campos para horário de funcionamento iniciados com null
  const [horaAbertura, setHoraAbertura] = useState(null);
  const [horaFechamento, setHoraFechamento] = useState(null);
  const [showTimePickerAbertura, setShowTimePickerAbertura] = useState(false);
  const [showTimePickerFechamento, setShowTimePickerFechamento] = useState(false);

  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso às suas fotos para continuar.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.cancelled && !result.canceled) {
      setFoto(result.uri);
    }
  };

  const handleTimeChange = (pickerType, { hours, minutes }) => {
    const selected = new Date();
    selected.setHours(hours);
    selected.setMinutes(minutes);
    if (pickerType === 'abertura') {
      setHoraAbertura(selected);
      setShowTimePickerAbertura(false);
    } else if (pickerType === 'fechamento') {
      setHoraFechamento(selected);
      setShowTimePickerFechamento(false);
    }
  };

  const handleCreate = async () => {
    if (!nome.trim()) {
      return Alert.alert('Atenção', 'Nome da quadra é obrigatório.');
    }
    // Verifica se os horários foram definidos
    if (!horaAbertura || !horaFechamento) {
      return Alert.alert('Atenção', 'Defina os horários de abertura e fechamento.');
    }
    setLoading(true);
    try {
      const payload = {
        id_empresa: companyId,
        nome,
        foto,
        preco_hora: precoHora,
        promocao_ativa: promocaoAtiva,
        descricao_promocao: descricaoPromocao,
        rede_disponivel: redeDisponivel,
        bola_disponivel: bolaDisponivel,
        observacoes,
        capacidade: capacidade || "0",
        // Envia os horários no formato HH:MM
        hora_abertura: horaAbertura.toTimeString().slice(0, 5),
        hora_fechamento: horaFechamento.toTimeString().slice(0, 5),
      };

      // Corrigido o endpoint para utilizar a rota de empresas/quadras
      const response = await api.post('/api/empresas/quadras', payload);

      if (response.status === 201 || response.status === 200) {
        Alert.alert('Sucesso', 'Quadra cadastrada com sucesso!');
        navigation.setParams({ newQuadraAdded: true });
        navigation.goBack();
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar a quadra.');
      }
    } catch (error) {
      console.log('Erro ao criar quadra:', error?.response?.data || error.message);
      Alert.alert('Erro', error?.response?.data?.message || 'Não foi possível cadastrar a quadra.');
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
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Quadra</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Seção de Foto */}
        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoButton}
            onPress={handleSelectPhoto}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.photoButtonGradient}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#FFF" />
              <Text style={styles.photoButtonText}>
                {foto ? 'Alterar Foto' : 'Adicionar Foto'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          {foto && (
            <Image source={{ uri: foto }} style={styles.photoPreview} />
          )}
        </View>

        {/* Seção de Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="soccer-field" size={20} color="#4A90E2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome da Quadra"
              value={nome}
              onChangeText={setNome}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="currency-brl" size={20} color="#4A90E2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Preço por Hora"
              value={precoHora}
              onChangeText={setPrecoHora}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-group" size={20} color="#4A90E2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Capacidade (número de pessoas)"
              value={capacidade}
              onChangeText={setCapacidade}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Seção de Horário de Funcionamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário de Funcionamento</Text>
          <View style={styles.dateTimeContainer}>
            <DateTimeButton
              label="Abertura"
              value={horaAbertura ? horaAbertura.toTimeString().slice(0,5) : 'Selecionar'}
              onPress={() => setShowTimePickerAbertura(true)}
              icon="time-outline"
            />
            <DateTimeButton
              label="Fechamento"
              value={horaFechamento ? horaFechamento.toTimeString().slice(0,5) : 'Selecionar'}
              onPress={() => setShowTimePickerFechamento(true)}
              icon="time-outline"
            />
          </View>
          <TimePickerModal
            locale="pt-BR"
            visible={showTimePickerAbertura}
            onDismiss={() => setShowTimePickerAbertura(false)}
            onConfirm={(time) => handleTimeChange('abertura', time)}
            // Caso horaAbertura seja null, usa os valores atuais como padrão
            hours={horaAbertura ? horaAbertura.getHours() : new Date().getHours()}
            minutes={horaAbertura ? horaAbertura.getMinutes() : new Date().getMinutes()}
          />
          <TimePickerModal
            locale="pt-BR"
            visible={showTimePickerFechamento}
            onDismiss={() => setShowTimePickerFechamento(false)}
            onConfirm={(time) => handleTimeChange('fechamento', time)}
            hours={horaFechamento ? horaFechamento.getHours() : new Date().getHours()}
            minutes={horaFechamento ? horaFechamento.getMinutes() : new Date().getMinutes()}
          />
        </View>

        {/* Seção de Promoção */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promoção</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Promoção Ativa</Text>
            <Switch
              value={promocaoAtiva}
              onValueChange={setPromocaoAtiva}
              trackColor={{ false: '#767577', true: '#2ECC71' }}
              thumbColor={promocaoAtiva ? '#27AE60' : '#f4f3f4'}
            />
          </View>
          {promocaoAtiva && (
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="tag" size={20} color="#4A90E2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Descrição da Promoção"
                value={descricaoPromocao}
                onChangeText={setDescricaoPromocao}
              />
            </View>
          )}
        </View>

        {/* Seção de Recursos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos Disponíveis</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Rede</Text>
            <Switch
              value={redeDisponivel}
              onValueChange={setRedeDisponivel}
              trackColor={{ false: '#767577', true: '#2ECC71' }}
              thumbColor={redeDisponivel ? '#27AE60' : '#f4f3f4'}
            />
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Bola</Text>
            <Switch
              value={bolaDisponivel}
              onValueChange={setBolaDisponivel}
              trackColor={{ false: '#767577', true: '#2ECC71' }}
              thumbColor={bolaDisponivel ? '#27AE60' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Seção de Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="note-text" size={20} color="#4A90E2" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observações adicionais"
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      {/* Botão de Salvar */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleCreate}
        disabled={loading}
      >
        <LinearGradient
          colors={['#2ECC71', '#27AE60']}
          style={styles.saveButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={24} color="#FFF" />
              <Text style={styles.saveButtonText}>Salvar Quadra</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Estilos para os intervalos (mantidos ou adicionados conforme necessário)
  intervaloButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#EEE',
    marginRight: 10,
  },
  intervaloButtonSelecionado: {
    backgroundColor: '#4CAF50',
  },
  intervaloText: {
    fontSize: 16,
    color: '#333',
  },
  intervaloBuscarButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  intervaloBuscarButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  intervalosContainer: {
    marginVertical: 10,
  },
  intervalosLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  // Demais estilos existentes
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
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    padding: 16,
  },
  photoButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  photoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  photoButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2D3748',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  saveButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
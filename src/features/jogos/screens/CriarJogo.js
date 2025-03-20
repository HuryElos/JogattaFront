import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { DatePickerModal } from 'react-native-paper-dates';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons'; // Importa FontAwesome5 para o ícone de vôlei
import api from '../../../services/api';
import InputField from '../components/InputFields';
import DateTimeButton from '../components/DateTimeButton';
import { validarCampos } from '../utils/validarCampo';

/**  
 * Converte um slot "HH:MM" em minutos.
 */
const slotToMinutes = (slot) => {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
};

/**  
 * Gera slots de horário entre horaAbertura e horaFechamento, com intervalo (step) em minutos.
 */
const gerarSlots = (horaAbertura, horaFechamento, stepMinutes = 30) => {
  const slots = [];
  const [openH, openM] = horaAbertura.split(':').map(Number);
  const [closeH, closeM] = horaFechamento.split(':').map(Number);
  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  while (current < end) {
    const hh = String(Math.floor(current / 60)).padStart(2, '0');
    const mm = String(current % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
    current += stepMinutes;
  }
  return slots;
};

/**  
 * Verifica se um slot está ocupado, dado um array de intervalos ocupados.
 */
const isSlotOcupado = (slot, occupiedIntervals) => {
  const slotMin = slotToMinutes(slot);
  for (const interval of occupiedIntervals) {
    const [startH, startM] = interval.horario_inicio.split(':').map(Number);
    const [endH, endM] = interval.horario_fim.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (slotMin >= startMin && slotMin < endMin) {
      return true;
    }
  }
  return false;
};

const CriarJogo = ({ navigation }) => {
  // Estados dos dados do jogo
  const [nomeJogo, setNomeJogo] = useState('');
  const [limiteJogadores, setLimiteJogadores] = useState('');
  const [descricao, setDescricao] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tempoNotificacao, setTempoNotificacao] = useState('10');
  const [habilitarNotificacao, setHabilitarNotificacao] = useState(true);
  const [tempoNotificacaoModo, setTempoNotificacaoModo] = useState('padrao'); // padrao ou personalizado

  // Seleção de Empresa / Quadra
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [quadras, setQuadras] = useState([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState(null);

  // Data da Reserva
  const [data, setData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const handleDateChange = ({ date }) => {
    setShowDatePicker(false);
    if (date) setData(date);
  };

  // Slots de Horário
  const [intervalosOcupados, setIntervalosOcupados] = useState([]);
  const [slots, setSlots] = useState([]);
  const [startSlot, setStartSlot] = useState(null);
  const [endSlot, setEndSlot] = useState(null);
  const [loadingIntervalos, setLoadingIntervalos] = useState(false);

  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingQuadras, setLoadingQuadras] = useState(false);

  // Opções rápidas para o tempo de notificação
  const opcoesTempoNotificacao = [
    { valor: '5', label: '5 min' },
    { valor: '10', label: '10 min' },
    { valor: '15', label: '15 min' },
  ];

  const selecionarTempoNotificacao = (tempo) => {
    setTempoNotificacao(tempo);
    setTempoNotificacaoModo('padrao');
  };

  const ativarTempoPersonalizado = () => {
    setTempoNotificacaoModo('personalizado');
  };

  // Buscar Empresas
  const buscarEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      const response = await api.get('/api/empresas');
      if (response.status === 200) {
        setEmpresas(response.data || []);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar as empresas.');
    } finally {
      setLoadingEmpresas(false);
    }
  };

  // Buscar Quadras para a Empresa Selecionada
  const buscarQuadras = async (id_empresa) => {
    setLoadingQuadras(true);
    try {
      const response = await api.get(`/api/empresas/${id_empresa}/quadras`);
      if (response.status === 200) {
        setQuadras(response.data || []);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar as quadras da empresa.');
    } finally {
      setLoadingQuadras(false);
    }
  };

  // Buscar Intervalos Ocupados e Gerar Slots
  const buscarIntervalos = async () => {
    if (!quadraSelecionada) {
      Alert.alert('Atenção', 'Selecione uma quadra para consultar disponibilidade.');
      return;
    }
    setLoadingIntervalos(true);
    try {
      const dataFormatada = data.toISOString().split('T')[0];
      const response = await api.get(
        `/api/jogador/reservas/disponibilidade/${quadraSelecionada.id_quadra}`,
        { params: { data: dataFormatada } }
      );
      setIntervalosOcupados(response.data);
      const horaAbertura = quadraSelecionada.hora_abertura || '06:00';
      const horaFechamento = quadraSelecionada.hora_fechamento || '22:00';
      const generatedSlots = gerarSlots(horaAbertura, horaFechamento, 30);
      const slotsComStatus = generatedSlots.map((slot) => ({
        slot,
        ocupado: isSlotOcupado(slot, response.data),
      }));
      setSlots(slotsComStatus);
      if (!generatedSlots.length) {
        Alert.alert('Disponibilidade', 'Nenhum slot disponível.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar os horários disponíveis.');
    } finally {
      setLoadingIntervalos(false);
    }
  };

  const validar = useCallback(() => {
    return validarCampos({
      nomeJogo,
      limiteJogadores,
      dataJogo: data,
    });
  }, [nomeJogo, limiteJogadores, data]);

  useEffect(() => {
    buscarEmpresas();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      buscarQuadras(empresaSelecionada.id_empresa);
      // Resetar quadra e slots
      setQuadras([]);
      setQuadraSelecionada(null);
      setSlots([]);
      setStartSlot(null);
      setEndSlot(null);
    }
  }, [empresaSelecionada]);

  useEffect(() => {
    setIntervalosOcupados([]);
    setSlots([]);
    setStartSlot(null);
    setEndSlot(null);
  }, [data, quadraSelecionada]);

  // Manipula a seleção dos slots
  const handleSlotPress = (slot) => {
    if (!startSlot) {
      setStartSlot(slot);
      setEndSlot(null);
      return;
    }
    if (!endSlot) {
      if (slotToMinutes(slot) <= slotToMinutes(startSlot)) {
        setStartSlot(slot);
        setEndSlot(null);
      } else {
        setEndSlot(slot);
      }
      return;
    }
    setStartSlot(slot);
    setEndSlot(null);
  };

  const criarJogo = useCallback(async () => {
    const validacao = validar();
    if (!validacao.isValid) {
      Alert.alert('Erro', validacao.message);
      return;
    }
    if (!empresaSelecionada) {
      Alert.alert('Erro', 'Selecione uma empresa.');
      return;
    }
    if (!quadraSelecionada) {
      Alert.alert('Erro', 'Selecione uma quadra.');
      return;
    }
    if (!startSlot || !endSlot) {
      Alert.alert('Erro', 'Selecione horário de início e fim.');
      return;
    }
    if (slotToMinutes(endSlot) <= slotToMinutes(startSlot)) {
      Alert.alert('Erro', 'O horário de término deve ser depois do início.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado.');
      const { id } = jwtDecode(token);
      const dataFormatada = data.toISOString().split('T')[0];

      const payload = {
        nome_jogo: nomeJogo.trim(),
        limite_jogadores: parseInt(limiteJogadores, 10),
        id_usuario: id,
        descricao: descricao.trim() || null,
        chave_pix: chavePix.trim() || null,
        habilitar_notificacao: habilitarNotificacao,
        tempo_notificacao: parseInt(tempoNotificacao, 10),
        id_empresa: empresaSelecionada.id_empresa,
        id_quadra: quadraSelecionada.id_quadra,
        data_reserva: dataFormatada,
        reserva_hora_inicio: startSlot,
        reserva_hora_fim: endSlot,
        status_reserva: 'pendente',
      };

      const response = await api.post('/api/jogos/criar', payload);
      Alert.alert('Sucesso', 'Sala criada com sucesso!');
      navigation.navigate('LiveRoom', { id_jogo: response.data.id_jogo });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a sala. Tente novamente.');
    }
  }, [
    validar,
    nomeJogo,
    limiteJogadores,
    data,
    descricao,
    chavePix,
    tempoNotificacao,
    habilitarNotificacao,
    empresaSelecionada,
    quadraSelecionada,
    startSlot,
    endSlot,
    navigation,
  ]);

  return (
    <KeyboardAvoidingView
      style={baseStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header customizado */}
      <View style={baseStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={baseStyles.headerTitle}>Criar Jogo</Text>
      </View>

      <ScrollView contentContainerStyle={baseStyles.scrollContent}>
        {/* Ícone ilustrativo com bola de vôlei */}
        <FontAwesome5 name="volleyball-ball" size={50} color="#FF8A3D" style={baseStyles.icon} />

        {/* PASSO 1: Selecionar Empresa */}
        <View style={localStyles.stepContainer}>
          <Text style={localStyles.stepTitle}>1. Escolha a Empresa</Text>
          {loadingEmpresas ? (
            <ActivityIndicator size="small" color="#FF8A3D" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {empresas.map((item) => (
                <TouchableOpacity
                  key={item.id_empresa}
                  style={[
                    baseStyles.itemButton,
                    empresaSelecionada?.id_empresa === item.id_empresa && baseStyles.itemButtonSelected,
                  ]}
                  onPress={() => setEmpresaSelecionada(item)}
                >
                  <Text style={baseStyles.itemText}>{item.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* PASSO 2: Selecionar Quadra */}
        {empresaSelecionada && (
          <View style={localStyles.stepContainer}>
            <Text style={localStyles.stepTitle}>2. Escolha a Quadra</Text>
            {loadingQuadras ? (
              <ActivityIndicator size="small" color="#FF8A3D" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {quadras.map((item) => (
                  <TouchableOpacity
                    key={item.id_quadra}
                    style={[
                      baseStyles.itemButton,
                      quadraSelecionada?.id_quadra === item.id_quadra && baseStyles.itemButtonSelected,
                    ]}
                    onPress={() => setQuadraSelecionada(item)}
                  >
                    <Text style={baseStyles.itemText}>{item.nome}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* PASSO 3: Selecionar Data e Buscar Slots */}
        {quadraSelecionada && (
          <View style={localStyles.stepContainer}>
            <Text style={localStyles.stepTitle}>3. Data da Reserva</Text>
            <TouchableOpacity
              style={[baseStyles.itemButton, { marginBottom: 10 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#666" style={{ marginRight: 5 }} />
              <Text style={baseStyles.itemText}>{data.toISOString().split('T')[0]}</Text>
            </TouchableOpacity>
            <DatePickerModal
              locale="pt-BR"
              mode="single"
              visible={showDatePicker}
              onDismiss={() => setShowDatePicker(false)}
              date={data}
              onConfirm={handleDateChange}
            />
            <TouchableOpacity style={baseStyles.buscarButton} onPress={buscarIntervalos}>
              <Text style={baseStyles.buscarButtonText}>
                {loadingIntervalos ? 'Buscando horários...' : 'Buscar Horários Disponíveis'}
              </Text>
            </TouchableOpacity>
            {slots.length > 0 && (
              <>
                <Text style={localStyles.stepSubtitle}>Selecione Horário de Início e Fim:</Text>
                <View style={localStyles.slotsContainer}>
                  {slots.map((item) => (
                    <TouchableOpacity
                      key={item.slot}
                      style={[
                        localStyles.slotButton,
                        item.ocupado ? localStyles.slotOcupado : localStyles.slotLivre,
                        startSlot && slotToMinutes(item.slot) === slotToMinutes(startSlot) && localStyles.slotInicio,
                        endSlot && slotToMinutes(item.slot) === slotToMinutes(endSlot) && localStyles.slotFim,
                      ]}
                      disabled={item.ocupado}
                      onPress={() => handleSlotPress(item.slot)}
                    >
                      <Text style={localStyles.slotText}>{item.slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {startSlot && endSlot && (
                  <Text style={localStyles.selectedRangeText}>
                    Intervalo Selecionado: {startSlot} - {endSlot}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* PASSO 4: Dados do Jogo */}
        <View style={localStyles.stepContainer}>
          <Text style={localStyles.stepTitle}>4. Detalhes do Jogo</Text>
          <InputField
            label="Nome do Jogo"
            placeholder="Ex: Torneio de Sábado"
            value={nomeJogo}
            onChangeText={setNomeJogo}
          />
          <InputField
            label="Limite de Jogadores"
            placeholder="Ex: 10"
            value={limiteJogadores}
            onChangeText={setLimiteJogadores}
            keyboardType="numeric"
          />
          <InputField
            label="Descrição (Opcional)"
            placeholder="Ex: Vôlei descontraído"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
          <InputField
            label="Chave PIX (Opcional)"
            placeholder="Ex: 12345678900"
            value={chavePix}
            onChangeText={setChavePix}
          />

          {/* Seção de Notificação */}
          <View style={localStyles.notificacaoContainer}>
            <Text style={localStyles.notificacaoLabel}>Tempo de Notificação</Text>
            <View style={localStyles.opcoesTempo}>
              {opcoesTempoNotificacao.map((opcao) => (
                <TouchableOpacity
                  key={opcao.valor}
                  style={[
                    localStyles.opcaoTempoButton,
                    tempoNotificacao === opcao.valor &&
                      tempoNotificacaoModo === 'padrao' &&
                      localStyles.opcaoTempoSelecionada,
                  ]}
                  onPress={() => selecionarTempoNotificacao(opcao.valor)}
                >
                  <Text
                    style={[
                      localStyles.opcaoTempoText,
                      tempoNotificacao === opcao.valor &&
                        tempoNotificacaoModo === 'padrao' &&
                        localStyles.opcaoTempoTextSelecionada,
                    ]}
                  >
                    {opcao.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  localStyles.opcaoTempoButton,
                  tempoNotificacaoModo === 'personalizado' && localStyles.opcaoTempoSelecionada,
                ]}
                onPress={ativarTempoPersonalizado}
              >
                <Text
                  style={[
                    localStyles.opcaoTempoText,
                    tempoNotificacaoModo === 'personalizado' && localStyles.opcaoTempoTextSelecionada,
                  ]}
                >
                  Personalizar
                </Text>
              </TouchableOpacity>
            </View>
            {tempoNotificacaoModo === 'personalizado' && (
              <InputField
                label="Tempo personalizado (minutos)"
                placeholder="Ex: 30"
                value={tempoNotificacao}
                onChangeText={setTempoNotificacao}
                keyboardType="numeric"
                style={localStyles.inputPersonalizado}
              />
            )}
          </View>

          <View style={baseStyles.switchContainer}>
            <Text style={baseStyles.switchLabel}>Habilitar Notificação Automática?</Text>
            <Switch value={habilitarNotificacao} onValueChange={setHabilitarNotificacao} />
          </View>
        </View>

        {/* Botão Final */}
        <TouchableOpacity style={baseStyles.createButton} onPress={criarJogo}>
          <Ionicons name="checkmark-done" size={20} color="#FFF" style={baseStyles.createButtonIcon} />
          <Text style={baseStyles.createButtonText}>Criar Sala</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8A3D',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  icon: {
    alignSelf: 'center',
    marginVertical: 12,
  },
  itemButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    marginBottom: 5,
  },
  itemButtonSelected: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  itemText: {
    color: '#333',
    fontSize: 14,
  },
  buscarButton: {
    backgroundColor: '#FF8A3D',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  buscarButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#FF8A3D',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});

const localStyles = StyleSheet.create({
  stepContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginVertical: 8,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  slotButton: {
    width: 60,
    height: 40,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotLivre: {
    backgroundColor: '#E6FFFA',
  },
  slotOcupado: {
    backgroundColor: '#FED7D7',
  },
  slotInicio: {
    borderWidth: 2,
    borderColor: '#FF8A3D',
  },
  slotFim: {
    borderWidth: 2,
    borderColor: '#F56565',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
  },
  selectedRangeText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8A3D',
  },
  notificacaoContainer: {
    marginBottom: 16,
  },
  notificacaoLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
  },
  opcoesTempo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  opcaoTempoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  opcaoTempoSelecionada: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  opcaoTempoText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  opcaoTempoTextSelecionada: {
    color: '#FFF',
  },
  inputPersonalizado: {
    marginTop: 8,
  },
});

export default CriarJogo;

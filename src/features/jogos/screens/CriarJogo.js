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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons'; // Ícone de vôlei
import api from '../../../services/api';
import InputField from '../components/InputFields';
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
  let end = closeH * 60 + closeM;
  // Se o fim for menor ou igual ao início, assume que termina no dia seguinte
  if (end <= current) {
    end += 24 * 60;
  }
  while (current < end) {
    const hh = String(Math.floor((current % (24 * 60)) / 60)).padStart(2, '0');
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

/**
 * Em visualização resumida, retorna apenas os slots cujo minuto seja "00".
 */
const getSummarySlots = (groupSlots) => {
  const summary = groupSlots.filter((s) => s.slot.endsWith(':00'));
  if (summary.length === 0 && groupSlots.length > 0) {
    return [groupSlots[0]];
  }
  return summary;
};

const CriarJogo = ({ navigation }) => {
  // Estados do jogo
  const [nomeJogo, setNomeJogo] = useState('');
  const [limiteJogadores, setLimiteJogadores] = useState('');
  const [descricao, setDescricao] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tempoNotificacao, setTempoNotificacao] = useState('10');
  const [habilitarNotificacao, setHabilitarNotificacao] = useState(true);
  const [tempoNotificacaoModo, setTempoNotificacaoModo] = useState('padrao');

  // Seleção de Empresa / Quadra
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [quadras, setQuadras] = useState([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState(null);

  // Data da Reserva
  const [data, setData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Slots de Horário
  const [intervalosOcupados, setIntervalosOcupados] = useState([]);
  const [slots, setSlots] = useState([]);
  const [startSlot, setStartSlot] = useState(null);
  const [endSlot, setEndSlot] = useState(null);
  const [loadingIntervalos, setLoadingIntervalos] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingQuadras, setLoadingQuadras] = useState(false);

  // Alternar entre detalhado (30 min) e resumido (1h)
  const [showDetailedSlots, setShowDetailedSlots] = useState(false);

  // Opções rápidas para notificação
  const opcoesTempoNotificacao = [
    { valor: '5', label: '5 min' },
    { valor: '10', label: '10 min' },
    { valor: '15', label: '15 min' },
  ];

  // ---------- Efeitos e Fetch ----------
  useEffect(() => {
    buscarEmpresas();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      buscarQuadras(empresaSelecionada.id_empresa);
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

  // Funções de busca
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

  const buscarIntervalos = async () => {
    if (!quadraSelecionada) {
      Alert.alert('Atenção', 'Selecione uma quadra primeiro.');
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

  // Lógica de seleção de slots:
  // 1. Se não houver startSlot, o clique define o início.
  // 2. Se houver startSlot e não houver endSlot, o clique define o fim.
  // 3. Se ambos já estiverem definidos, o clique reinicia a seleção.
  const handleSlotPress = (slot) => {
    if (!startSlot) {
      setStartSlot(slot);
      return;
    }
    if (!endSlot) {
      if (slot === startSlot) return;
      setEndSlot(slot);
      return;
    }
    setStartSlot(slot);
    setEndSlot(null);
  };

  // Cálculo de duração e custo: se o horário final for menor ou igual ao inicial, soma 24h.
  let durationMin = 0;
  if (startSlot && endSlot && quadraSelecionada) {
    const start = slotToMinutes(startSlot);
    let end = slotToMinutes(endSlot);
    if (end <= start) {
      end += 24 * 60;
    }
    durationMin = end - start;
  }
  const totalCost =
    durationMin > 0 && quadraSelecionada
      ? ((durationMin / 60) * quadraSelecionada.preco_hora).toFixed(2)
      : null;

  // Criação do jogo e reserva com debug
  const criarJogo = useCallback(async () => {
    const validacao = validarCampos({
      nomeJogo,
      limiteJogadores,
      dataJogo: data,
    });
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
    if (slotToMinutes(startSlot) === slotToMinutes(endSlot)) {
      Alert.alert('Erro', 'Horário de início e fim não podem ser iguais.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado.');
      const { id } = jwtDecode(token);
      const dataFormatada = data.toISOString().split('T')[0];

      // Determina se termina no dia seguinte
      const startMin = slotToMinutes(startSlot);
      const endMin = slotToMinutes(endSlot);
      const termina_no_dia_seguinte = endMin <= startMin;

      const payload = {
        nome_jogo: nomeJogo.trim(),
        limite_jogadores: parseInt(limiteJogadores, 10),
        id_usuario: id,
        descricao: descricao.trim() || null,
        chave_pix: chavePix.trim() || null,
        habilitar_notificacao: habilitarNotificacao, // Corrigido: usamos a variável correta
        tempo_notificacao: parseInt(tempoNotificacao, 10),
        id_empresa: empresaSelecionada.id_empresa,
        id_quadra: quadraSelecionada.id_quadra,
        data_reserva: dataFormatada,
        reserva_hora_inicio: startSlot,
        reserva_hora_fim: endSlot,
        status_reserva: 'pendente',
        termina_no_dia_seguinte, // Flag para indicar que termina no dia seguinte
      };

      console.log('Payload enviado:', payload);

      const response = await api.post('/api/jogos/criar', payload);
      Alert.alert('Sucesso', 'Sala criada com sucesso!');
      navigation.navigate('LiveRoom', { id_jogo: response.data.id_jogo });
    } catch (error) {
      console.error('Erro ao criar jogo:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível criar a sala. Tente novamente.');
    }
  }, [
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

  // Agrupamento de slots por período
  const periodOrder = ['Madrugada', 'Manhã', 'Tarde', 'Noite'];
  const groupedSlots = slots.reduce((acc, item) => {
    const hour = parseInt(item.slot.split(':')[0], 10);
    let period = '';
    if (hour < 6) period = 'Madrugada';
    else if (hour < 12) period = 'Manhã';
    else if (hour < 18) period = 'Tarde';
    else period = 'Noite';
    if (!acc[period]) acc[period] = [];
    acc[period].push(item);
    return acc;
  }, {});

  return (
    <KeyboardAvoidingView
      style={baseStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={baseStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={baseStyles.headerTitle}>Criar Jogo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={baseStyles.scrollContent}>
        {/* Título */}
        <View style={styles.topIconContainer}>
          <FontAwesome5 name="volleyball-ball" size={40} color="#FFA869" />
          <Text style={styles.screenSubtitle}>Monte sua Partida</Text>
        </View>

        {/* Bloco: Empresa e Quadra */}
        <View style={styles.blockContainer}>
          <Text style={styles.blockTitle}>Local</Text>
          <View style={styles.lineRow}>
            <Text style={styles.labelSmall}>Empresa</Text>
            {loadingEmpresas && <ActivityIndicator size="small" color="#FF8A3D" />}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {empresas.map((item) => (
              <TouchableOpacity
                key={item.id_empresa}
                style={[
                  styles.selectButton,
                  empresaSelecionada?.id_empresa === item.id_empresa && styles.selectButtonActive,
                ]}
                onPress={() => setEmpresaSelecionada(item)}
              >
                <Text style={styles.selectButtonText}>{item.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {empresaSelecionada && (
            <>
              <View style={[styles.lineRow, { marginTop: 10 }]}>
                <Text style={styles.labelSmall}>Quadra</Text>
                {loadingQuadras && <ActivityIndicator size="small" color="#FF8A3D" />}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                {quadras.map((item) => (
                  <TouchableOpacity
                    key={item.id_quadra}
                    style={[
                      styles.selectButton,
                      quadraSelecionada?.id_quadra === item.id_quadra && styles.selectButtonActive,
                    ]}
                    onPress={() => setQuadraSelecionada(item)}
                  >
                    <Text style={styles.selectButtonText}>{item.nome}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Bloco: Data e Horários */}
        {quadraSelecionada && (
          <View style={styles.blockContainer}>
            <Text style={styles.blockTitle}>Horários</Text>
            <View style={[styles.lineRow, { marginBottom: 6 }]}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={{ marginRight: 5 }} />
                <Text style={styles.dateButtonText}>{data.toISOString().split('T')[0]}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkButton} onPress={buscarIntervalos}>
                {loadingIntervalos ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.checkButtonText}>Ver Horários</Text>
                )}
              </TouchableOpacity>
            </View>
            <DatePickerModal
              locale="pt-BR"
              mode="single"
              visible={showDatePicker}
              onDismiss={() => setShowDatePicker(false)}
              date={data}
              onConfirm={({ date }) => {
                setShowDatePicker(false);
                if (date) setData(date);
              }}
            />
            {slots.length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.toggleViewButton}
                  onPress={() => setShowDetailedSlots(!showDetailedSlots)}
                >
                  <MaterialCommunityIcons
                    name={showDetailedSlots ? 'clock-outline' : 'clock-alert-outline'}
                    size={16}
                    color="#FF8A3D"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.toggleViewButtonText}>
                    {showDetailedSlots ? 'Resumo por hora' : 'Ver em intervalos de 30 min'}
                  </Text>
                </TouchableOpacity>
                {periodOrder.map((period) => {
                  if (!groupedSlots[period] || groupedSlots[period].length === 0) return null;
                  const displaySlots = showDetailedSlots
                    ? groupedSlots[period]
                    : getSummarySlots(groupedSlots[period]);
                  return (
                    <View key={period} style={{ marginTop: 8 }}>
                      <Text style={styles.periodLabel}>{period}</Text>
                      <View style={styles.slotBlock}>
                        {displaySlots.map((item) => {
                          const inInterval =
                            startSlot &&
                            endSlot &&
                            slotToMinutes(item.slot) >= slotToMinutes(startSlot) &&
                            slotToMinutes(item.slot) <= slotToMinutes(endSlot);
                          const isStartOrEnd =
                            (startSlot && slotToMinutes(item.slot) === slotToMinutes(startSlot)) ||
                            (endSlot && slotToMinutes(item.slot) === slotToMinutes(endSlot));
                          return (
                            <TouchableOpacity
                              key={item.slot}
                              style={[
                                styles.slotButton,
                                item.ocupado && styles.slotOcupado,
                                inInterval && !item.ocupado && styles.slotInterval,
                                isStartOrEnd && !item.ocupado && styles.slotSelected,
                              ]}
                              disabled={item.ocupado}
                              onPress={() => handleSlotPress(item.slot)}
                            >
                              <Text style={styles.slotText}>{item.slot}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
                {startSlot && endSlot && (
                  <View style={styles.selectedInfo}>
                    <View>
                      <Text style={styles.selectedInfoText}>
                        {startSlot} - {endSlot}
                      </Text>
                      {slotToMinutes(endSlot) <= slotToMinutes(startSlot) && (
                        <Text style={styles.crossMidnightText}>
                          * Termina no dia seguinte
                        </Text>
                      )}
                    </View>
                    {quadraSelecionada.preco_hora && (
                      <Text style={styles.selectedInfoPrice}>R$ {totalCost}</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Bloco: Dados do Jogo */}
        <View style={styles.blockContainer}>
          <Text style={styles.blockTitle}>Detalhes</Text>
          <InputField
            label="Nome do Jogo"
            placeholder="Torneio de Sábado"
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
            label="Descrição (opcional)"
            placeholder="Ex: Vôlei descontraído"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
          <InputField
            label="Chave PIX (opcional)"
            placeholder="Ex: 12345678900"
            value={chavePix}
            onChangeText={setChavePix}
          />

          <Text style={[styles.labelSmall, { marginTop: 8 }]}>Notificações</Text>
          <View style={styles.lineRow}>
            <Text style={styles.smallText}>Ativar?</Text>
            <Switch
              value={habilitarNotificacao}
              onValueChange={setHabilitarNotificacao}
              trackColor={{ false: '#ccc', true: '#FFA869' }}
              thumbColor="#FFF"
            />
          </View>
          <View style={styles.lineRow}>
            {opcoesTempoNotificacao.map((opcao) => (
              <TouchableOpacity
                key={opcao.valor}
                style={[
                  styles.notifButton,
                  tempoNotificacao === opcao.valor &&
                    tempoNotificacaoModo === 'padrao' &&
                    styles.notifButtonActive,
                ]}
                onPress={() => {
                  setTempoNotificacao(opcao.valor);
                  setTempoNotificacaoModo('padrao');
                }}
              >
                <Text
                  style={[
                    styles.notifButtonText,
                    tempoNotificacao === opcao.valor &&
                      tempoNotificacaoModo === 'padrao' &&
                      { color: '#FFF' },
                  ]}
                >
                  {opcao.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.notifButton,
                tempoNotificacaoModo === 'personalizado' && styles.notifButtonActive,
              ]}
              onPress={() => setTempoNotificacaoModo('personalizado')}
            >
              <Text
                style={[
                  styles.notifButtonText,
                  tempoNotificacaoModo === 'personalizado' && { color: '#FFF' },
                ]}
              >
                Personalizar
              </Text>
            </TouchableOpacity>
          </View>
          {tempoNotificacaoModo === 'personalizado' && (
            <InputField
              label="Minutos antes do jogo"
              placeholder="Ex: 30"
              value={tempoNotificacao}
              onChangeText={setTempoNotificacao}
              keyboardType="numeric"
              style={{ marginTop: 8 }}
            />
          )}
        </View>

        <TouchableOpacity style={styles.createButton} onPress={criarJogo}>
          <Ionicons name="checkmark-done" size={18} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.createButtonText}>Criar Jogo</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CriarJogo;

// ---------- Estilos ----------
const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8A3D',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#FFF',
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  topIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  screenSubtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#444',
  },
  blockContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  blockTitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelSmall: {
    fontSize: 13,
    color: '#666',
  },
  smallText: {
    fontSize: 13,
    color: '#333',
  },
  horizontalList: {
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  selectButtonActive: {
    backgroundColor: '#FFA869',
    borderColor: '#FFA869',
  },
  selectButtonText: {
    fontSize: 13,
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  dateButtonText: {
    fontSize: 13,
    color: '#333',
  },
  checkButton: {
    backgroundColor: '#FF8A3D',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  checkButtonText: {
    fontSize: 13,
    color: '#FFF',
  },
  toggleViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF5ED',
  },
  toggleViewButtonText: {
    fontSize: 12,
    color: '#FF8A3D',
  },
  periodLabel: {
    fontSize: 13,
    color: '#666',
    marginVertical: 4,
  },
  slotBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotButton: {
    width: 52,
    height: 32,
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
  },
  slotOcupado: {
    backgroundColor: '#FED7D7',
  },
  slotInterval: {
    backgroundColor: '#B3E5FC',
  },
  slotSelected: {
    borderWidth: 2,
    borderColor: '#FF8A3D',
  },
  slotText: {
    fontSize: 12,
    color: '#333',
  },
  selectedInfo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInfoText: {
    fontSize: 14,
    color: '#FF8A3D',
  },
  selectedInfoPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8A3D',
  },
  crossMidnightText: {
    fontSize: 11,
    color: 'tomato',
    marginTop: 2,
  },
  notifButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  notifButtonActive: {
    backgroundColor: '#FFA869',
    borderColor: '#FFA869',
  },
  notifButtonText: {
    fontSize: 13,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#FF8A3D',
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 15,
    color: '#FFF',
  },
});

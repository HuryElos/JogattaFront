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
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { DatePickerModal } from 'react-native-paper-dates';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../../../services/api';
import InputField from '../components/InputFields';
import { validarCampos } from '../utils/validarCampo';

// Interfaces
interface Empresa {
  id_empresa: number;
  nome: string;
  status: string;
}

interface Quadra {
  id_quadra: number;
  nome: string;
  hora_abertura: string;
  hora_fechamento: string;
  preco_hora: number;
}

interface IntervaloOcupado {
  horario_inicio: string;
  horario_fim: string;
}

interface Slot {
  slot: string;
  ocupado: boolean;
}

interface GroupedSlots {
  [key: string]: Slot[];
}

interface NavigationProps {
  navigation: StackNavigationProp<any>;
}

interface OpcaoTempoNotificacao {
  valor: string;
  label: string;
}

/**
 * Converte um slot "HH:MM" em minutos.
 */
const slotToMinutes = (slot: string): number => {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Gera slots de horário entre horaAbertura e horaFechamento, com intervalo (step) em minutos.
 */
const gerarSlots = (horaAbertura: string, horaFechamento: string, stepMinutes: number = 30): string[] => {
  const slots: string[] = [];
  const [openH, openM] = horaAbertura.split(':').map(Number);
  const [closeH, closeM] = horaFechamento.split(':').map(Number);
  let current = openH * 60 + openM;
  let end = closeH * 60 + closeM;

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
const isSlotOcupado = (slot: string, occupiedIntervals: IntervaloOcupado[]): boolean => {
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
const getSummarySlots = (groupSlots: Slot[]): Slot[] => {
  const summary = groupSlots.filter((s) => s.slot.endsWith(':00'));
  if (summary.length === 0 && groupSlots.length > 0) {
    return [groupSlots[0]];
  }
  return summary;
};

const CriarJogo: React.FC<NavigationProps> = ({ navigation }) => {
  // Estados do jogo
  const [nomeJogo, setNomeJogo] = useState<string>('');
  const [limiteJogadores, setLimiteJogadores] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [chavePix, setChavePix] = useState<string>('');
  const [tempoNotificacao, setTempoNotificacao] = useState<string>('10');
  const [habilitarNotificacao, setHabilitarNotificacao] = useState<boolean>(true);
  const [tempoNotificacaoModo, setTempoNotificacaoModo] = useState<'padrao' | 'personalizado'>('padrao');

  // Seleção de Empresa / Quadra
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState<Quadra | null>(null);

  // Data da Reserva
  const [data, setData] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Slots de Horário
  const [intervalosOcupados, setIntervalosOcupados] = useState<IntervaloOcupado[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startSlot, setStartSlot] = useState<string | null>(null);
  const [endSlot, setEndSlot] = useState<string | null>(null);
  const [loadingIntervalos, setLoadingIntervalos] = useState<boolean>(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState<boolean>(false);
  const [loadingQuadras, setLoadingQuadras] = useState<boolean>(false);

  // Alternar entre detalhado (30 min) e resumido (1h)
  const [showDetailedSlots, setShowDetailedSlots] = useState<boolean>(false);

  // Opções rápidas para notificação
  const opcoesTempoNotificacao: OpcaoTempoNotificacao[] = [
    { valor: '5', label: '5 min' },
    { valor: '10', label: '10 min' },
    { valor: '15', label: '15 min' },
  ];

  // Novos estados para o modal de seleção de local
  const [showLocalModal, setShowLocalModal] = useState<boolean>(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
  const [selectedQuadraId, setSelectedQuadraId] = useState<number | null>(null);
  const [modalStep, setModalStep] = useState<'empresa' | 'quadra'>('empresa');
  const [previewEmpresa, setPreviewEmpresa] = useState<Empresa | null>(null);

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
    if (quadraSelecionada) {
      buscarIntervalos();
    }
  }, [data, quadraSelecionada]);

  // Funções de busca
  const buscarEmpresas = async (): Promise<void> => {
    setLoadingEmpresas(true);
    try {
      const response = await api.get('/api/empresas');
      if (response.status === 200) {
        setEmpresas(response.data.filter((company: Empresa) => company.status === 'ativo') || []);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar as empresas.');
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const buscarQuadras = async (id_empresa: number): Promise<void> => {
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

  const buscarIntervalos = async (): Promise<void> => {
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
      const slotsComStatus: Slot[] = generatedSlots.map((slot) => ({
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

  // Lógica de seleção de slots
  const handleSlotPress = (slot: string): void => {
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

  // Cálculo de duração e custo
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

  // Criação do jogo e reserva
  const criarJogo = useCallback(async (): Promise<void> => {
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
      const { id } = jwtDecode<{ id: number }>(token);
      const dataFormatada = data.toISOString().split('T')[0];

      const startMin = slotToMinutes(startSlot);
      const endMin = slotToMinutes(endSlot);
      const termina_no_dia_seguinte = endMin <= startMin;

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
        termina_no_dia_seguinte,
      };

      const response = await api.post('/api/jogos/criar', payload);
      Alert.alert('Sucesso', 'Sala criada com sucesso!');
      navigation.navigate('LiveRoom', { id_jogo: response.data.id_jogo });
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
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
  const groupedSlots = slots.reduce<GroupedSlots>((acc, item) => {
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

  const handleSelectEmpresa = (empresa: Empresa) => {
    setSelectedEmpresaId(empresa.id_empresa);
    setEmpresaSelecionada(empresa);
    setPreviewEmpresa(empresa);
    buscarQuadras(empresa.id_empresa);
    setModalStep('quadra');
  };

  const handleBackToEmpresa = () => {
    setModalStep('empresa');
    setSelectedQuadraId(null);
    setQuadraSelecionada(null);
  };

  const handleSelectQuadra = (quadra: Quadra) => {
    setSelectedQuadraId(quadra.id_quadra);
    setQuadraSelecionada(quadra);
  };

  const handleConfirmLocal = () => {
    setShowLocalModal(false);
    setModalStep('empresa');
    setPreviewEmpresa(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A3D" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={30} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <FontAwesome5 name="volleyball-ball" size={40} color="#fff" />
            <Text style={styles.screenSubtitle}>Monte sua Partida</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Título */}

          {/* Modal de Seleção de Local */}
          <Modal
            visible={showLocalModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              setShowLocalModal(false);
              setModalStep('empresa');
              setPreviewEmpresa(null);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  {modalStep === 'quadra' && (
                    <TouchableOpacity
                      onPress={handleBackToEmpresa}
                      style={styles.modalBackButton}
                    >
                      <Ionicons name="arrow-back" size={24} color="#64748B" />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.modalTitle}>
                    {modalStep === 'empresa' ? 'Selecionar Empresa' : 'Selecionar Quadra'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowLocalModal(false);
                      setModalStep('empresa');
                      setPreviewEmpresa(null);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {modalStep === 'empresa' ? (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Empresas</Text>
                      {loadingEmpresas ? (
                        <ActivityIndicator size="small" color="#FF8A3D" />
                      ) : (
                        <View style={styles.empresasList}>
                          {empresas.map((empresa) => (
                            <TouchableOpacity
                              key={empresa.id_empresa}
                              style={[
                                styles.empresaItem,
                                selectedEmpresaId === empresa.id_empresa && styles.selectedItem
                              ]}
                              onPress={() => handleSelectEmpresa(empresa)}
                            >
                              <MaterialCommunityIcons
                                name="office-building"
                                size={24}
                                color={selectedEmpresaId === empresa.id_empresa ? "#FFF" : "#64748B"}
                              />
                              <Text
                                style={[
                                  styles.empresaItemText,
                                  selectedEmpresaId === empresa.id_empresa && styles.selectedItemText
                                ]}
                              >
                                {empresa.nome}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Quadras Disponíveis</Text>
                      {loadingQuadras ? (
                        <ActivityIndicator size="small" color="#FF8A3D" />
                      ) : (
                        <View style={styles.quadrasList}>
                          {quadras.map((quadra) => (
                            <TouchableOpacity
                              key={quadra.id_quadra}
                              style={[
                                styles.quadraItem,
                                selectedQuadraId === quadra.id_quadra && styles.selectedItem
                              ]}
                              onPress={() => handleSelectQuadra(quadra)}
                            >
                              <MaterialCommunityIcons
                                name="basketball"
                                size={24}
                                color={selectedQuadraId === quadra.id_quadra ? "#FFF" : "#64748B"}
                              />
                              <View style={styles.quadraInfo}>
                                <Text
                                  style={[
                                    styles.quadraItemText,
                                    selectedQuadraId === quadra.id_quadra && styles.selectedItemText
                                  ]}
                                >
                                  {quadra.nome}
                                </Text>
                                <Text
                                  style={[
                                    styles.quadraHorario,
                                    selectedQuadraId === quadra.id_quadra && styles.selectedItemText
                                  ]}
                                >
                                  {quadra.hora_abertura} - {quadra.hora_fechamento}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.quadraPreco,
                                  selectedQuadraId === quadra.id_quadra && styles.selectedItemText
                                ]}
                              >
                                R$ {quadra.preco_hora}/hora
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                {modalStep === 'quadra' && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        !quadraSelecionada && styles.confirmButtonDisabled
                      ]}
                      onPress={handleConfirmLocal}
                      disabled={!quadraSelecionada}
                    >
                      <Text style={styles.confirmButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>

          {/* Bloco: Empresa e Quadra */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Local</Text>
            <TouchableOpacity
              style={styles.infoContainer}
              onPress={() => setShowLocalModal(true)}
            >
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="office-building" size={20} color="#64748B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Empresa</Text>
                  <Text style={styles.infoValue}>
                    {empresaSelecionada ? empresaSelecionada.nome : 'Selecione uma empresa'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="basketball" size={20} color="#64748B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Quadra</Text>
                  <Text style={styles.infoValue}>
                    {quadraSelecionada ? quadraSelecionada.nome : 'Selecione uma quadra'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Bloco de resumo das informações */}
          {/* <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="information-outline" size={24} color="#FF8A3D" />
              <Text style={styles.cardTitle}>Informações do Local</Text>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="office-building" size={20} color="#64748B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Empresa</Text>
                  <Text style={styles.infoValue}>
                    {empresaSelecionada ? empresaSelecionada.nome : 'Não selecionada'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="basketball" size={20} color="#64748B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Quadra</Text>
                  <Text style={styles.infoValue}>
                    {quadraSelecionada ? quadraSelecionada.nome : 'Não selecionada'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Horário</Text>
                  <Text style={styles.infoValue}>
                    {startSlot && endSlot ? `${startSlot} - ${endSlot}` : 'Não selecionado'}
                  </Text>
                </View>
              </View>
            </View>
          </View> */}

          {/* Bloco: Data e Horários */}
          {quadraSelecionada && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="clock-outline" size={24} color="#FF8A3D" />
                <Text style={styles.cardTitle}>Horários Disponíveis</Text>
              </View>

              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#64748B"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.dateButtonText}>
                    {data.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </Text>
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
                  <View style={styles.viewOptions}>
                    <TouchableOpacity
                      style={[
                        styles.viewOption,
                        !showDetailedSlots && styles.viewOptionActive
                      ]}
                      onPress={() => setShowDetailedSlots(false)}
                    >
                      <MaterialCommunityIcons
                        name="clock-alert-outline"
                        size={16}
                        color={!showDetailedSlots ? "#FFF" : "#FF8A3D"}
                      />
                      <Text style={[
                        styles.viewOptionText,
                        !showDetailedSlots && styles.viewOptionTextActive
                      ]}>
                        Resumo por hora
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.viewOption,
                        showDetailedSlots && styles.viewOptionActive
                      ]}
                      onPress={() => setShowDetailedSlots(true)}
                    >
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={16}
                        color={showDetailedSlots ? "#FFF" : "#FF8A3D"}
                      />
                      <Text style={[
                        styles.viewOptionText,
                        showDetailedSlots && styles.viewOptionTextActive
                      ]}>
                        Intervalos de 30 min
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {periodOrder.map((period) => {
                    if (!groupedSlots[period] || groupedSlots[period].length === 0) return null;
                    const displaySlots = showDetailedSlots
                      ? groupedSlots[period]
                      : getSummarySlots(groupedSlots[period]);
                    return (
                      <View key={period} style={styles.periodBlock}>
                        <View style={styles.periodHeader}>
                          <MaterialCommunityIcons
                            name={getPeriodIcon(period)}
                            size={20}
                            color="#64748B"
                          />
                          <Text style={styles.periodLabel}>{period}</Text>
                        </View>
                        <View style={styles.slotsGrid}>
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
                                <Text
                                  style={[
                                    styles.slotText,
                                    isStartOrEnd && styles.slotTextSelected,
                                    item.ocupado && styles.slotTextOcupado
                                  ]}
                                >
                                  {item.slot}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}

                  {startSlot && endSlot && (
                    <View style={styles.selectedInfo}>
                      <View style={styles.selectedTimeContainer}>
                        <MaterialCommunityIcons name="clock-check-outline" size={20} color="#FF8A3D" />
                        <View>
                          <Text style={styles.selectedTimeText}>
                            {startSlot} - {endSlot}
                          </Text>
                          {slotToMinutes(endSlot) <= slotToMinutes(startSlot) && (
                            <Text style={styles.crossMidnightText}>
                              * Termina no dia seguinte
                            </Text>
                          )}
                        </View>
                      </View>
                      {quadraSelecionada.preco_hora && (
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceLabel}>Total:</Text>
                          <Text style={styles.selectedPriceText}>
                            R$ {totalCost}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Bloco: Detalhes */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="information-outline" size={24} color="#FF8A3D" />
              <Text style={styles.cardTitle}>Informações Básicas</Text>
            </View>
            <InputField
              label={
                <View style={styles.labelContainer}>
                  <Text style={styles.labelText}>Nome do Jogo</Text>
                  <Text style={styles.requiredAsterisk}>*</Text>
                </View>
              }
              placeholder="Torneio de Sábado"
              value={nomeJogo}
              onChangeText={setNomeJogo}
            />
            <InputField
              label={
                <View style={styles.labelContainer}>
                  <Text style={styles.labelText}>Limite de Jogadores</Text>
                  <Text style={styles.requiredAsterisk}>*</Text>
                </View>
              }
              placeholder="Ex: 10"
              value={limiteJogadores}
              onChangeText={setLimiteJogadores}
              keyboardType="numeric"
            />
            <Text style={styles.requiredFieldsText}>* Campos obrigatórios</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="text-box-outline" size={24} color="#FF8A3D" />
              <Text style={styles.cardTitle}>Descrição</Text>
            </View>
            <InputField
              label="Descrição do Jogo"
              placeholder="Ex: Vôlei descontraído"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="qrcode" size={24} color="#FF8A3D" />
              <Text style={styles.cardTitle}>Pagamento</Text>
            </View>
            <InputField
              label="Chave PIX"
              placeholder="Ex: 12345678900"
              value={chavePix}
              onChangeText={setChavePix}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FF8A3D" />
              <Text style={styles.cardTitle}>Notificações</Text>
            </View>
            
            <View style={styles.notificationContainer}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Ativar notificações</Text>
                <Switch
                  value={habilitarNotificacao}
                  onValueChange={setHabilitarNotificacao}
                  trackColor={{ false: '#E2E8F0', true: '#FFA869' }}
                  thumbColor="#FFF"
                />
              </View>

              {habilitarNotificacao && (
                <>
                  <Text style={[styles.labelSmall, { marginTop: 16, marginBottom: 8 }]}>
                    Tempo de antecedência
                  </Text>
                  <View style={styles.notificationOptions}>
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
                            styles.notifButtonTextActive,
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
                          tempoNotificacaoModo === 'personalizado' && styles.notifButtonTextActive,
                        ]}
                      >
                        Personalizar
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {tempoNotificacaoModo === 'personalizado' && (
                    <View style={{ marginTop: 12 }}>
                      <InputField
                        label="Minutos antes do jogo"
                        placeholder="Ex: 30"
                        value={tempoNotificacao}
                        onChangeText={setTempoNotificacao}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={criarJogo}>
            <Ionicons name="checkmark-done" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.createButtonText}>Criar Jogo</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CriarJogo;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FF8A3D',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FF8A3D',
    height: 150,
  },
  headerButton: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: 25,
    left: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  screenSubtitle: {
    marginTop: 8,
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelSmall: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  smallText: {
    fontSize: 13,
    color: '#333',
  },
  horizontalList: {
    marginTop: 8,
    marginBottom: 4,
  },
  selectButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  selectButtonActive: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  selectButtonTextActive: {
    color: '#FFF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 12,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  checkButton: {
    backgroundColor: '#FF8A3D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  toggleViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FFF5ED',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  toggleViewButtonText: {
    fontSize: 12,
    color: '#FF8A3D',
    fontWeight: '500',
  },
  periodBlock: {
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
    marginLeft: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  slotButton: {
    width: 56,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotOcupado: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FEE2E2',
  },
  slotInterval: {
    backgroundColor: '#BFDBFE',
    borderColor: '#BFDBFE',
  },
  slotSelected: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  slotText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  slotTextSelected: {
    color: '#FFF',
  },
  slotTextOcupado: {
    color: '#EF4444',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5ED',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedTimeText: {
    fontSize: 15,
    color: '#FF8A3D',
    fontWeight: '600',
  },
  crossMidnightText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  selectedPriceText: {
    fontSize: 18,
    color: '#FF8A3D',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#1E293B',
  },
  notificationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  notifButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  notifButtonActive: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  notifButtonText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  notifButtonTextActive: {
    color: '#FFF',
  },
  createButton: {
    backgroundColor: '#FF8A3D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalBackButton: {
    padding: 4,
    marginRight: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  confirmButton: {
    backgroundColor: '#FF8A3D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  empresasList: {
    gap: 8,
  },
  empresaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  empresaItemText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    marginLeft: 12,
  },
  selectedItem: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  selectedItemText: {
    color: '#FFF',
  },
  quadrasList: {
    gap: 8,
  },
  quadraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quadraInfo: {
    flex: 1,
    marginLeft: 12,
  },
  quadraItemText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  quadraHorario: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  quadraPreco: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  viewOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  viewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF8A3D',
    backgroundColor: '#FFF',
  },
  viewOptionActive: {
    backgroundColor: '#FF8A3D',
  },
  viewOptionText: {
    fontSize: 13,
    color: '#FF8A3D',
    fontWeight: '500',
    marginLeft: 4,
  },
  viewOptionTextActive: {
    color: '#FFF',
  },
  notificationContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  requiredAsterisk: {
    color: '#EF4444',
    marginLeft: 4,
    fontSize: 14,
  },
  requiredFieldsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

const getPeriodIcon = (period: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (period) {
    case 'Madrugada':
      return 'weather-night';
    case 'Manhã':
      return 'weather-sunny';
    case 'Tarde':
      return 'weather-partly-cloudy';
    case 'Noite':
      return 'weather-sunset';
    default:
      return 'clock-outline';
  }
}; 
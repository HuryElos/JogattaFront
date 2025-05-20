import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { DatePickerModal } from 'react-native-paper-dates';
import api from '../../../services/api';

interface Empresa {
  id_empresa: number;
  nome: string;
  status: string;
  endereco: string;
}

interface Quadra {
  id_quadra: number;
  nome: string;
  hora_abertura: string;
  hora_fechamento: string;
  preco_hora: number;
  possui_bola: boolean;
  endereco: string;
  imagem_url?: string;
}

interface NavigationProps {
  navigation: StackNavigationProp<any>;
}

interface Slot {
  slot: string;
  ocupado: boolean;
}

const SelecionarQuadraScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [quadrasPorEmpresa, setQuadrasPorEmpresa] = useState<{[key: number]: Quadra[]}>({});
  const [empresaSelecionada, setEmpresaSelecionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [quadraSelecionada, setQuadraSelecionada] = useState<Quadra | null>(null);
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null);
  const [data, setData] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startSlot, setStartSlot] = useState<string | null>(null);
  const [endSlot, setEndSlot] = useState<string | null>(null);

  useEffect(() => {
    buscarEmpresas();
  }, []);

  const buscarEmpresas = async () => {
    try {
      const response = await api.get('/api/empresas');
      if (response.status === 200) {
        const empresasAtivas = response.data.filter((company: Empresa) => company.status === 'ativo');
        setEmpresas(empresasAtivas);
        
        // Buscar quadras para cada empresa
        empresasAtivas.forEach((empresa: Empresa) => {
          buscarQuadras(empresa.id_empresa);
        });
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarQuadras = async (id_empresa: number) => {
    try {
      const response = await api.get(`/api/empresas/${id_empresa}/quadras`);
      if (response.status === 200) {
        // Adicionar dados fictícios para exemplo e garantir que preco_hora seja número
        const quadrasComDadosExtras = response.data.map((quadra: Quadra) => ({
          ...quadra,
          preco_hora: Number(quadra.preco_hora) || 0, // Garante que seja número
          possui_bola: Math.random() > 0.5,
          endereco: 'Rua Exemplo, 123 - Bairro',
          imagem_url: 'https://via.placeholder.com/150',
        }));
        setQuadrasPorEmpresa(prev => ({
          ...prev,
          [id_empresa]: quadrasComDadosExtras,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar quadras:', error);
    }
  };

  const handleQuadraPress = async (empresa: Empresa, quadra: Quadra) => {
    setEmpresaAtual(empresa);
    setQuadraSelecionada(quadra);
    setModalVisible(true);
    await buscarHorariosDisponiveis(quadra.id_quadra);
  };

  const buscarHorariosDisponiveis = async (id_quadra: number) => {
    setLoadingSlots(true);
    try {
      const dataFormatada = data.toISOString().split('T')[0];
      const response = await api.get(
        `/api/jogador/reservas/disponibilidade/${id_quadra}`,
        { params: { data: dataFormatada } }
      );
      
      const horaAbertura = quadraSelecionada?.hora_abertura || '06:00';
      const horaFechamento = quadraSelecionada?.hora_fechamento || '22:00';
      const generatedSlots = gerarSlots(horaAbertura, horaFechamento, 30);
      
      const slotsComStatus = generatedSlots.map(slot => ({
        slot,
        ocupado: isSlotOcupado(slot, response.data),
      }));
      
      setSlots(slotsComStatus);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      Alert.alert('Erro', 'Não foi possível buscar os horários disponíveis.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotPress = (slot: string) => {
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

  const confirmarSelecao = () => {
    if (!empresaAtual || !quadraSelecionada || !startSlot || !endSlot) {
      console.log('Dados incompletos:', { empresaAtual, quadraSelecionada, startSlot, endSlot });
      Alert.alert('Erro', 'Por favor, selecione todos os dados necessários.');
      return;
    }
    
    // Garante que os dados estão no formato correto
    const empresaFormatada = {
      ...empresaAtual,
      quadras: quadrasPorEmpresa[empresaAtual.id_empresa] || []
    };

    const quadraFormatada = {
      ...quadraSelecionada,
      preco_hora: Number(quadraSelecionada.preco_hora) || 0,
      hora_abertura: quadraSelecionada.hora_abertura || '06:00',
      hora_fechamento: quadraSelecionada.hora_fechamento || '22:00',
      endereco: quadraSelecionada.endereco || empresaAtual.endereco
    };

    const dataFormatada = data.toISOString().split('T')[0];

    console.log('Confirmando seleção com dados formatados:', {
      empresa: empresaFormatada.nome,
      quadra: quadraFormatada.nome,
      inicio: startSlot,
      fim: endSlot,
      data: dataFormatada
    });

    // Limpa os estados antes de navegar
    setModalVisible(false);
    setStartSlot(null);
    setEndSlot(null);

    // Navega de volta com os dados formatados
    navigation.navigate('CriarJogo', {
      empresaSelecionada: empresaFormatada,
      quadraSelecionada: quadraFormatada,
      horarioInicio: startSlot,
      horarioFim: endSlot,
      dataReserva: dataFormatada
    });
  };

  const slotToMinutes = (slot: string): number => {
    const [h, m] = slot.split(':').map(Number);
    return h * 60 + m;
  };

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

  const isSlotOcupado = (slot: string, occupiedIntervals: any[]): boolean => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8A3D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A3D" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecionar Quadra</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Lista de Empresas */}
        <Text style={styles.sectionTitle}>Empresas Disponíveis</Text>
        
        {empresas.map((empresa) => (
          <View key={empresa.id_empresa} style={styles.empresaContainer}>
            <TouchableOpacity
              style={styles.empresaHeader}
              onPress={() => setEmpresaSelecionada(
                empresaSelecionada === empresa.id_empresa ? null : empresa.id_empresa
              )}
            >
              <View style={styles.empresaInfo}>
                <MaterialCommunityIcons 
                  name="domain" 
                  size={24} 
                  color="#FF8A3D" 
                />
                <Text style={styles.empresaNome}>{empresa.nome}</Text>
              </View>
              <Ionicons
                name={empresaSelecionada === empresa.id_empresa ? "chevron-up" : "chevron-down"}
                size={24}
                color="#64748B"
              />
            </TouchableOpacity>

            {empresaSelecionada === empresa.id_empresa && (
              <View style={styles.quadrasContainer}>
                {quadrasPorEmpresa[empresa.id_empresa]?.map((quadra) => (
                  <TouchableOpacity
                    key={quadra.id_quadra}
                    style={styles.quadraCard}
                    onPress={() => handleQuadraPress(empresa, quadra)}
                  >
                    <Image
                      source={{ uri: quadra.imagem_url }}
                      style={styles.quadraImagem}
                    />
                    <View style={styles.quadraInfo}>
                      <Text style={styles.quadraNome}>{quadra.nome}</Text>
                      <View style={styles.quadraDetalhes}>
                        <View style={styles.detalheItem}>
                          <MaterialCommunityIcons name="clock-outline" size={16} color="#64748B" />
                          <Text style={styles.detalheTexto}>
                            {quadra.hora_abertura} - {quadra.hora_fechamento}
                          </Text>
                        </View>
                        <View style={styles.detalheItem}>
                          <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
                          <Text style={styles.detalheTexto}>{quadra.endereco}</Text>
                        </View>
                        <View style={styles.detalheItem}>
                          <MaterialCommunityIcons 
                            name={quadra.possui_bola ? "volleyball" : "close-circle"} 
                            size={16} 
                            color={quadra.possui_bola ? "#10B981" : "#EF4444"} 
                          />
                          <Text style={styles.detalheTexto}>
                            {quadra.possui_bola ? "Bola disponível" : "Bola não disponível"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.precoContainer}>
                        <Text style={styles.precoLabel}>Valor/hora:</Text>
                        <Text style={styles.precoValor}>R$ {quadra.preco_hora.toFixed(2)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Modal de Horários */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Selecionar Horário</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#64748B" />
                <Text style={styles.dateButtonText}>
                  {data.toISOString().split('T')[0]}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => quadraSelecionada && buscarHorariosDisponiveis(quadraSelecionada.id_quadra)}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
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
                if (date) {
                  setData(date);
                  if (quadraSelecionada) {
                    buscarHorariosDisponiveis(quadraSelecionada.id_quadra);
                  }
                }
              }}
            />

            <ScrollView style={styles.slotsContainer}>
              {loadingSlots ? (
                <ActivityIndicator size="large" color="#FF8A3D" style={styles.loader} />
              ) : (
                <View style={styles.slotsGrid}>
                  {slots.map((item) => {
                    const inInterval =
                      startSlot &&
                      endSlot &&
                      slotToMinutes(item.slot) >= slotToMinutes(startSlot) &&
                      slotToMinutes(item.slot) <= slotToMinutes(endSlot);
                    const isStartOrEnd =
                      item.slot === startSlot || item.slot === endSlot;
                    
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
                          ]}
                        >
                          {item.slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {startSlot && endSlot && (
              <View style={styles.selectedTimeContainer}>
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
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmarSelecao}
                >
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FF8A3D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FF8A3D',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  empresaContainer: {
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  empresaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
  },
  empresaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  empresaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  quadrasContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#F8FAFC',
  },
  quadraCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quadraImagem: {
    width: 100,
    height: 100,
  },
  quadraInfo: {
    flex: 1,
    padding: 12,
  },
  quadraNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  quadraDetalhes: {
    gap: 6,
  },
  detalheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detalheTexto: {
    fontSize: 13,
    color: '#64748B',
  },
  precoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  precoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  precoValor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF8A3D',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  datePickerContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  refreshButton: {
    backgroundColor: '#FF8A3D',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotsContainer: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 32,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    width: '23%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  slotOcupado: {
    backgroundColor: '#FEE2E2',
  },
  slotInterval: {
    backgroundColor: '#BFDBFE',
  },
  slotSelected: {
    backgroundColor: '#FF8A3D',
  },
  slotText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  slotTextSelected: {
    color: '#FFF',
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  crossMidnightText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#FF8A3D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default SelecionarQuadraScreen; 
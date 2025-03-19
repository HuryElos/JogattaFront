// src/screens/HomeScreen.js

import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import AuthContext from '../contexts/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const brandColor = '#E0E0E0'; // cor principal
const STATUS_COLORS = {
  ativa: '#34D399',
  fechada: '#EF4444',
  encerrada: '#9CA3AF',
  aberto: '#34D399',
  'balanceando times': '#F59E0B',
  'em andamento': '#3B82F6',
};

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [salasAtivas, setSalasAtivas] = useState([]);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [salaId, setSalaId] = useState('');
  
  // Adicionando estado para o modal de código
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);

  // Estados para modais
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [showProcessedModal, setShowProcessedModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [tempPlayersData, setTempPlayersData] = useState([]);

  // Contagem de gênero
  const genderCounts = useMemo(() => {
    return tempPlayersData.reduce(
      (acc, p) => {
        if (p.genero === 'M') acc.masculino++;
        if (p.genero === 'F') acc.feminino++;
        return acc;
      },
      { masculino: 0, feminino: 0 }
    );
  }, [tempPlayersData]);

  // Limpa os estados dos modais quando a tela perde o foco
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Limpa todos os estados quando a tela perde o foco
        setShowPasteModal(false);
        setShowFlowModal(false);
        setShowProcessedModal(false);
        setShowEnterCodeModal(false);
        setPastedText('');
        setTempPlayersData([]);
        setSalaId('');
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      fetchSalasAtivas();
    }, [])
  );

  const fetchSalasAtivas = async () => {
    setLoadingSalas(true);
    try {
      const response = await api.get('/api/lobby/me');
      if (response.status === 200 && Array.isArray(response.data.salas)) {
        const filtradas = response.data.salas.filter((s) =>
          ['aberto', 'balanceando times', 'em andamento'].includes(s.status)
        );
        const ordenadas = filtradas.sort((a, b) => {
          const dataA = moment(`${a.data_jogo}T${a.horario_inicio}`);
          const dataB = moment(`${b.data_jogo}T${b.horario_inicio}`);
          return dataA.diff(dataB);
        });
        setSalasAtivas(ordenadas);
      } else {
        setSalasAtivas([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar as salas ativas.');
    } finally {
      setLoadingSalas(false);
    }
  };

  const handleEnterSala = async () => {
    if (!salaId.trim()) {
      return Alert.alert('Erro', 'Por favor, insira um ID válido da sala.');
    }
    try {
      const uuid = salaId.trim();
      const response = await api.get(`/api/convites/${uuid}`);
      if (response.status === 200 && response.data.convite) {
        const convite = response.data.convite;
        const payload = {
          id_jogo: convite.id_jogo,
          id_usuario: user.id,
          convite_uuid: convite.convite_uuid || null,
        };
        const enterResponse = await api.post('/api/lobby/entrar', payload);
        if (enterResponse.status === 200) {
          Alert.alert('Sucesso', 'Você entrou na sala!');
          navigation.navigate('LiveRoom', { id_jogo: convite.id_jogo });
        } else {
          throw new Error('Erro ao entrar na sala.');
        }
      } else {
        Alert.alert('Erro', 'Convite inválido ou não encontrado.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível entrar na sala.');
      console.error('handleEnterSala:', error);
    }
    // Limpar código e fechar modal após a tentativa
    setSalaId('');
    setShowEnterCodeModal(false);
  };

  // Extração de nomes da lista com "✅"
  const parsePlayerList = (text) => {
    const lines = text.split('\n');
    const players = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.includes('✅')) {
        let nome = trimmed.replace(/^\d+\.\s*/, '');
        nome = nome.replace(/✅/g, '').trim();
        if (nome) players.push(nome);
      }
    });
    return players;
  };

  const handleProcessList = () => {
    const players = parsePlayerList(pastedText);
    if (players.length === 0) {
      Alert.alert('Atenção', 'Nenhum jogador confirmado foi encontrado na lista.');
      return;
    }
    const processedPlayers = players.map((nome, idx) => ({
      id_usuario: -(idx + 1),
      nome,
      genero: null,
      temporario: true,
    }));
    setTempPlayersData(processedPlayers);
    setShowPasteModal(false);
    setShowProcessedModal(true);
  };

  const handleGenderSelect = (player, gender) => {
    const updated = tempPlayersData.map((p) => {
      if (p.nome === player.nome) {
        return { ...p, genero: gender };
      }
      return p;
    });
    setTempPlayersData(updated);
  };

  const handleConfirmProcessedPlayers = () => {
    if (!tempPlayersData.every((p) => p.genero)) {
      return Alert.alert('Atenção', 'Defina o gênero de todos antes de continuar.');
    }
    setShowProcessedModal(false);
    setShowFlowModal(true);
  };

  /**
   * Se clicar em "Manual" ou "Automático" dentro do modal:
   *   - Manual => queremos primeiro a tela de 'DefineTeamSizeScreen'
   *   - Automático => segue direto pra 'JogoScreen'
   */
  const handleSelectFlow = (flowType) => {
    // Limpa os estados antes de navegar
    setShowPasteModal(false);
    setShowFlowModal(false);
    setShowProcessedModal(false);
    setPastedText('');
    // Aqui está o *pequeno ajuste* para mandar p/ a tela de definir tamanho, antes de ir para ManualJogoScreen
    if (flowType === 'manual') {
      navigation.navigate('JogosFlow', {
        screen: 'DefineTeamSizeScreen',
        params: { players: tempPlayersData },
      });
    } else {
      navigation.navigate('JogosFlow', {
        screen: 'JogoScreen',
        params: { tempPlayers: tempPlayersData, fluxo: 'automatico' },
      });
    }
  };
  // Criação do carrossel 
  // Renderização de um Card de Partida
  const renderPartidaCard = (partida) => {
    const dataJogo = moment(`${partida.data_jogo}T${partida.horario_inicio}`);
    const horarioFim = moment(`${partida.data_jogo}T${partida.horario_fim}`);
   
    return (
      <TouchableOpacity
        key={partida.id_jogo}
        style={styles.partidaCard}
        onPress={() => navigation.navigate('LiveRoom', { id_jogo: partida.id_jogo })}
      >
        <View style={styles.partidaIconContainer}>
          <MaterialCommunityIcons name="volleyball" size={24} color="#FF6B00" />
        </View>

        <Text style={styles.partidaTitle}>Partida {partida.id_jogo}</Text>

        <View style={styles.partidaInfo}>
          <MaterialCommunityIcons name="calendar" size={16} color="#666" />
          <Text style={styles.partidaText}>
            {dataJogo.format('dddd, DD [de] MMMM')}
          </Text>
        </View>
        <View style={styles.partidaInfo}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
          <Text style={styles.partidaText}>
            {dataJogo.format('HH:mm')} - {horarioFim.format('HH:mm')}
          </Text>
        </View>
        <TouchableOpacity style={styles.acessarButton}>
          <Text style={styles.acessarButtonText}>Acessar partida</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView style={styles.container}>
       
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="account-circle-outline" size={24} color="#000" />
            <Text style={styles.headerText}>Olá, {user?.apelido || 'Fulane'}!</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Procure quadras ou partidas"
            placeholderTextColor="#666"
          />
        </View>

        {/* BANNER */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerText}>Alguma besteira falando sobre o app</Text>
        </View>

        {/* AÇÕES RÁPIDAS */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('JogosFlow', { screen: 'CriarJogo' })}
          >
            
            <Image
              source={require('../../assets/icons/add_circle.png')}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.actionText}>Criar{'\n'}partida</Text>
            
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowEnterCodeModal(true)}
          >
            <Image
              source={require('../../assets/icons/input_circle.png')}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.actionText}>Entrar na{'\n'}partida</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPasteModal(true)}
          >
            <Image
              source={require('../../assets/icons/list_alt_add.png')}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.actionText}>Importar{'\n'}lista</Text>
          </TouchableOpacity>

          {/* BOTÃO "EQUILIBRAR TIMES" */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('JogosFlow', {
              screen: 'EquilibrarTimesScreen'
            })}
          >
            <Image
              source={require('../../assets/icons/groups_3.png')}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.actionText}>Equilibrar{'\n'}times</Text>
          </TouchableOpacity>
        </View>

        {/* EXPLORAR QUADRAS */}
        <Text style={styles.sectionTitle}>Explorar quadras</Text>
        <View style={styles.exploreContainer}>
          <View style={styles.exploreRow}>
            {/* Card da esquerda: 2 partes (topo cinza + faixa laranja) */}
            <TouchableOpacity
              style={styles.leftCard}
              onPress={() => navigation.navigate('ExploreQuadras')}
            >
              {/* Parte de cima (simula "mapa") */}
              <View style={styles.mapTop} />
              {/* Parte de baixo (faixa laranja com texto) */}
              <View style={styles.mapBottom}>
                <Text style={styles.mapBottomText}>Quadras perto de você</Text>
              </View>
            </TouchableOpacity>

            {/* Coluna da direita: 2 cards cinza */}
            <View style={styles.rightColumn}>
              <TouchableOpacity style={styles.rightCard}>
                <View style={styles.rightCardTop} />
                <View style={styles.rightCardBottom}>
                  <Text style={styles.rightCardText}>Seus amigos vão</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rightCard}>
                <View style={styles.rightCardTop} />
                <View style={styles.rightCardBottom}>
                  <Text style={styles.rightCardText}>Descubra quadras</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* PRÓXIMAS PARTIDAS */}
        <View style={styles.nextMatchesHeader}>
          <Text style={styles.sectionTitle}>Próximas partidas</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView  
        horizontal={true}  
        showsHorizontalScrollIndicator={false}
        style={styles.partidasContainer}>
       
      
          {salasAtivas.slice(0, 2).map(renderPartidaCard)}
 

        </ScrollView>
      </ScrollView>

      {/* MODAL: COLAR LISTA */}
      <Modal
        visible={showPasteModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setPastedText('');
          setShowPasteModal(false);
          setShowFlowModal(false);
          setShowProcessedModal(false);
          setTempPlayersData([]);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Importar Lista de Jogadores</Text>
              <TouchableOpacity
                onPress={() => {
                  setPastedText('');
                  setShowPasteModal(false);
                  setShowFlowModal(false);
                  setShowProcessedModal(false);
                  setTempPlayersData([]);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Cole a lista de jogadores com confirmação (✅)
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Cole a lista de vôlei aqui..."
              value={pastedText}
              onChangeText={setPastedText}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleProcessList}>
              <Text style={styles.buttonText}>Processar Lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: CONFIRMAR JOGADORES (GÊNERO) */}
      <Modal
        visible={showProcessedModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowProcessedModal(false);
          setShowPasteModal(false);
          setShowFlowModal(false);
          setPastedText('');
          setTempPlayersData([]);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar Jogadores</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowProcessedModal(false);
                  setShowPasteModal(false);
                  setShowFlowModal(false);
                  setPastedText('');
                  setTempPlayersData([]);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.genderCountContainer}>
              <View style={styles.genderCountItem}>
                <View style={[styles.genderBadge, { backgroundColor: '#4A90E2' }]}>
                  <Text style={styles.genderText}>M</Text>
                </View>
                <Text style={styles.genderCountText}>{genderCounts.masculino}</Text>
              </View>
              <View style={styles.genderCountItem}>
                <View style={[styles.genderBadge, { backgroundColor: '#E91E63' }]}>
                  <Text style={styles.genderText}>F</Text>
                </View>
                <Text style={styles.genderCountText}>{genderCounts.feminino}</Text>
              </View>
              <View style={styles.genderCountItem}>
                <MaterialCommunityIcons name="account-group" size={20} color="#64748B" />
                <Text style={styles.genderCountText}>{tempPlayersData.length}</Text>
              </View>
            </View>

            <FlatList
              data={tempPlayersData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.playerItem}>
                  <View style={styles.playerInfo}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                    <Text style={styles.playerName}>{item.nome}</Text>
                  </View>
                  <View style={styles.genderButtons}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        item.genero === 'M' && styles.genderButtonSelected,
                        { backgroundColor: item.genero === 'M' ? '#4A90E2' : '#F1F5F9' },
                      ]}
                      onPress={() => handleGenderSelect(item, 'M')}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          item.genero === 'M' && styles.genderButtonTextSelected,
                        ]}
                      >
                        
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        item.genero === 'F' && styles.genderButtonSelected,
                        { backgroundColor: item.genero === 'F' ? '#E91E63' : '#F1F5F9' },
                      ]}
                      onPress={() => handleGenderSelect(item, 'F')}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          item.genero === 'F' && styles.genderButtonTextSelected,
                        ]}
                      >
                        
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              style={styles.playersList}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !tempPlayersData.every((p) => p.genero) && styles.primaryButtonDisabled,
              ]}
              onPress={handleConfirmProcessedPlayers}
              disabled={!tempPlayersData.every((p) => p.genero)}
            >
              <Text style={styles.buttonText}>Confirmar Jogadores</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: ESCOLHER FLUXO (MANUAL OU AUTOMÁTICO) */}
      <Modal
        visible={showFlowModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowFlowModal(false);
          setShowPasteModal(false);
          setShowProcessedModal(false);
          setPastedText('');
          setTempPlayersData([]);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.flowModalContent}>
            <View style={styles.flowModalHeader}>
              <Text style={styles.flowModalTitle}>Escolha o Fluxo</Text>
            </View>
            <Text style={styles.flowModalSubtitle}>
              Deseja equilibrar manualmente ou automaticamente?
            </Text>
            <View style={styles.flowButtonsContainer}>
              <TouchableOpacity
                style={[styles.flowButton, styles.manualButton]}
                onPress={() => handleSelectFlow('manual')}
              >
                <MaterialCommunityIcons name="hand-pointing-right" size={24} color="#FFF" />
                <Text style={styles.flowButtonText}>MANUAL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.flowButton, styles.autoButton]}
                onPress={() => handleSelectFlow('automatico')}
              >
                <MaterialCommunityIcons name="robot" size={24} color="#FFF" />
                <Text style={styles.flowButtonText}>AUTOMÁTICO</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowFlowModal(false);
                setShowPasteModal(false);
                setShowProcessedModal(false);
                setPastedText('');
                setTempPlayersData([]);
              }}
            >
              <Text style={styles.cancelButtonText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: INSERIR CÓDIGO DA SALA */}
      <Modal
        visible={showEnterCodeModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowEnterCodeModal(false);
          setSalaId('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.codeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrar na Partida</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEnterCodeModal(false);
                  setSalaId('');
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Insira o código da partida para entrar
            </Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Digite o código aqui..."
              value={salaId}
              onChangeText={setSalaId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                !salaId.trim() && styles.primaryButtonDisabled
              ]}
              onPress={handleEnterSala}
              disabled={!salaId.trim()}
            >
              <Text style={styles.buttonText}>Entrar na Partida</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* CONTAINERS GERAIS */
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 25,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  /* SEARCH BAR */
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 5,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },

  /* BANNER */
  bannerContainer: {
    backgroundColor: '#D8D8D8',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },

  /* AÇÕES RÁPIDAS */
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    width: 60,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: '#333',
  },

  /* Modal Entrar na partida*/
  codeModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    fontSize: 16,
    color: '#333',
  },

  /* TÍTULOS DE SEÇÃO */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#111',
  },

  /* EXPLORAR QUADRAS */
  exploreContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  exploreRow: {
    flexDirection: 'row',
    gap: 16,
  },
  leftCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FFF',
    height: 160,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapTop: {
    flex: 2,
    backgroundColor: '#D8D8D8',
  },
  mapBottom: {
    flex: 1,
    backgroundColor: brandColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBottomText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '600',
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rightCard: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#D8D8D8',
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rightCardTop: {
    flex: 1,
  },
  rightCardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  /* PRÓXIMAS PARTIDAS */
  nextMatchesHeader: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  partidasContainer: {
  
    flexDirection: 'row',  
    gap: 20,  
    padding: 16, 
    gap: 10,
    marginHorizontal: 16,
  },
  
  partidasContainer: {
  
    flexDirection: 'row',  
    gap: 20,  
    padding: 16, 
    gap: 10,
    marginHorizontal: 16,
  },
  partidaCard: {
      backgroundColor: '#F8F8F8',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      marginRight: 20,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4, 
  },
  
  partidaIconContainer: {
   
    backgroundColor: '#FFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partidaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  partidaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partidaText: {
    fontSize: 14,
    color: '#666',
  },
  acessarButton: {
    backgroundColor:  '#FF6B00',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  acessarButtonText: {
    
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },



  
  /* MODAIS GERAIS */
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    height: 150,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#A8A8A8',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },

  /* MODAL: CONFIRMAR JOGADORES */
  genderCountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  genderCountItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderCountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  genderBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  playersList: {
    maxHeight: 250,
    marginBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    paddingHorizontal: 4,
  },
  playerName: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderButtonSelected: {
    borderColor: 'transparent',
    elevation: 3,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  genderButtonTextSelected: {
    color: '#FFF',
  },

  /* MODAL: ESCOLHER FLUXO */
  flowModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  flowModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  flowModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  flowModalSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  flowButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  flowButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButton: {
    backgroundColor: '#4F46E5',
  },
  autoButton: {
    backgroundColor: '#10B981',
  },
  flowButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
});

// src/features/jogos/screens/ManualJogoScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  Switch,
  Modal,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

function getTimeColor(timeIndex) {
  if (timeIndex < 0) return '#999';
  const colors = [
    '#EF4444', // vermelho
    '#10B981', // verde
    '#3B82F6', // azul
    '#F59E0B', // amarelo
    '#8B5CF6', // roxo
    '#EC4899', // rosa
    '#14B8A6', // teal
  ];
  return colors[timeIndex % colors.length];
}

// Lista de animais para nomes aleatórios
const ANIMALS_LIST = [
  'Leão', 'Girafa', 'Onça', 'Elefante', 'Zebra', 'Lobo',
  'Coruja', 'Panda', 'Macaco', 'Raposa', 'Falcão', 'Gato',
  'Cachorro', 'Cavalo', 'Coelho', 'Rinoceronte', 'Hipopótamo',
  'Avestruz', 'Búfalo', 'Castor', 'Esquilo', 'Pinguim', 'Tartaruga',
];

export default function ManualJogoScreen({ route, navigation }) {
  const { players = [], fluxo = 'manual' } = route.params || {};

  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const options = [2, 3, 4, 5, 6];
  const [confirmed, setConfirmed] = useState(false);
  const [numTeams, setNumTeams] = useState(0);
  const [needExtraPlayers, setNeedExtraPlayers] = useState(0);
  const [showPopUp, setShowPopUp] = useState(false);
  const [timeWithOneLess, setTimeWithOneLess] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerAssignments, setPlayerAssignments] = useState({});
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [displayList, setDisplayList] = useState([]);
  const [playerIsSetter, setPlayerIsSetter] = useState({});
  const [showSetterModal, setShowSetterModal] = useState(false);

  // Se vier `playersPerTeam` da rota, já assumimos
  useEffect(() => {
    if (route.params?.playersPerTeam) {
      setPlayersPerTeam(route.params.playersPerTeam);
      setConfirmed(true);
    }
  }, [route.params?.playersPerTeam]);

  // Carrega a lista de jogadores (e prepara seus IDs internos)
  useEffect(() => {
    const initialAssignments = {};
    const initialSetters = {};
    const processed = players.map((player, index) => {
      const realId = player.id_usuario ?? player.id ?? `temp-${index}`;
      return {
        ...player,
        _internalId: String(realId),
        temporario: !!player.temporario,
      };
    });
    processed.forEach((p) => {
      initialAssignments[p._internalId] = -1;
      initialSetters[p._internalId] = false;
    });
    setAllPlayers(processed);
    setPlayerAssignments(initialAssignments);
    setPlayerIsSetter(initialSetters);
  }, [players]);

  // Quando "confirmed" for true, calcula quantos times e a possível sobra
  useEffect(() => {
    if (confirmed) {
      const totalPlayers = allPlayers.length;
      const nFullTeams = Math.floor(totalPlayers / playersPerTeam);
      const leftover = totalPlayers - nFullTeams * playersPerTeam;
      let nTeams = nFullTeams;
      if (leftover > 0) nTeams += 1;
      setNumTeams(nTeams);
      if (leftover > 0 && leftover <= 2) {
        // avisa revezamento
        // (se quiser, basta exibir um Alert aqui; mas deixei silencioso)
      } else if (leftover >= 3) {
        // caso ainda houvesse
        // mas neste fluxo, já resolvemos na tela anterior (DefineTeamSizeScreen)
      }
    }
  }, [confirmed, allPlayers, playersPerTeam]);

  // Contador de quantos em cada time
  const countAssigned = (timeIndex, assignmentsObj) => {
    return Object.values(assignmentsObj).filter((t) => t === timeIndex).length;
  };

  // Capacidade do time (ver se houve "desfalcado")
  const capacityOf = (timeIndex) => {
    if (timeWithOneLess && timeIndex === numTeams - 1 && needExtraPlayers > 0) {
      return playersPerTeam - needExtraPlayers;
    }
    return playersPerTeam;
  };

  // Verifica se time está cheio
  const isTeamFull = (timeIndex, assignmentsObj) => {
    const assignedCount = countAssigned(timeIndex, assignmentsObj);
    if (timeWithOneLess && timeIndex === numTeams - 1 && needExtraPlayers > 0) {
      const realCap = playersPerTeam - needExtraPlayers;
      return assignedCount >= realCap;
    }
    return assignedCount >= playersPerTeam;
  };

  // Seleciona time no topo
  const handleSelectTime = (timeIndex) => {
    setSelectedTimeIndex(timeIndex);
  };

  // Ao clicar no switch de um jogador
  const handleTogglePlayer = (playerKey, newVal) => {
    setPlayerAssignments((prev) => {
      const currentTime = prev[playerKey];
      if (newVal) {
        if (currentTime === selectedTimeIndex) return prev;
        if (isTeamFull(selectedTimeIndex, prev)) {
          Alert.alert('Time Cheio', `Time ${selectedTimeIndex + 1} já está completo!`);
          return prev;
        }
        const newObj = { ...prev, [playerKey]: selectedTimeIndex };
        // se encheu esse time, automaticamente seleciona o próximo
        if (countAssigned(selectedTimeIndex, newObj) >= capacityOf(selectedTimeIndex)) {
          if (selectedTimeIndex < numTeams - 1) {
            setTimeout(() => setSelectedTimeIndex((old) => old + 1), 300);
          }
        }
        return newObj;
      } else {
        // se tirou do time
        if (currentTime === selectedTimeIndex) {
          return { ...prev, [playerKey]: -1 };
        }
        return prev;
      }
    });
  };

  // Organizar lista (cria cabeçalhos "Time 1", "Time 2", etc.)
  const handleOrganizarLista = () => {
    const sorted = [...allPlayers];
    sorted.sort((a, b) => {
      const aTime = playerAssignments[a._internalId];
      const bTime = playerAssignments[b._internalId];
      if (aTime === bTime) return 0;
      if (aTime === -1) return 1;
      if (bTime === -1) return -1;
      return aTime - bTime;
    });
    setAllPlayers(sorted);

    let newDisplay = [];
    let lastTime = null;
    sorted.forEach((p) => {
      const t = playerAssignments[p._internalId];
      if (t !== lastTime) {
        newDisplay.push({ type: 'header', timeIndex: t });
        lastTime = t;
      }
      newDisplay.push({ type: 'player', player: p });
    });
    setDisplayList(newDisplay);
  };

  // Gera array de times (para copiar)
  const generateTeamsArray = () => {
    const result = [];
    for (let i = 0; i < numTeams; i++) {
      const playersInTeam = allPlayers.filter(
        (p) => playerAssignments[p._internalId] === i
      );
      result.push({ timeIndex: i, jogadores: playersInTeam });
    }
    return result;
  };

  // Copia a distribuição
  const handleCopyDistribution = async () => {
    try {
      const teams = generateTeamsArray();
  
      let text = '';
      teams.forEach((team, idx) => {
        text += `*Time ${idx + 1}*:\n`;
        team.jogadores.forEach((j) => {
          let line = `- ${j.nome}`;
          if (playerIsSetter[j._internalId]) {
            line += ' - Levantador';
          }
          text += `${line}\n`;
        });
        text += '\n';
      });
  
      // Verifica se todos jogadores foram atribuídos
const allAssigned = allPlayers.every(p => playerAssignments[p._internalId] !== -1);

// Verifica se todos os times estão completos
const allFull = Array.from({ length: numTeams }).every((_, idx) => {
  return countAssigned(idx, playerAssignments) === capacityOf(idx);
});

// Monta observações com base real
text += 'Observações:\n';
if (!allAssigned) {
  text += '- Ainda há jogadores sem time.\n';
} else if (allFull) {
  text += '- Times completos.\n';
} else {
  text += '- Alguns times estão incompletos.\n';
}

  
      await Clipboard.setStringAsync(text);
      Alert.alert('Sucesso', 'Lista copiada para a área de transferência!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o texto.');
    }
  };
  

  // Verifica se time atual está cheio
  const currentTeamFull = isTeamFull(selectedTimeIndex, playerAssignments);

  // Modal para selecionar levantadores
  const handleOpenSetterModal = () => {
    if (!currentTeamFull) {
      Alert.alert('Atenção', 'O time atual ainda não está completo!');
      return;
    }
    setShowSetterModal(true);
  };
  const handleCloseSetterModal = () => setShowSetterModal(false);

  const getPlayersOfSelectedTeam = () => {
    return allPlayers.filter((p) => playerAssignments[p._internalId] === selectedTimeIndex);
  };
  const handleToggleLevantador = (playerId) => {
    setPlayerIsSetter((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  // Render item para lista ORGANIZADA
  const renderItemOrganized = ({ item }) => {
    if (!item.type) return renderPlayerRaw(item);
    if (item.type === 'header') {
      const t = item.timeIndex;
      if (t < 0) {
        return (
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Sem Time</Text>
            <View style={styles.headerSeparator} />
          </View>
        );
      }
      return (
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: getTimeColor(t) }]}>
            Time {t + 1}
          </Text>
          <View style={styles.headerSeparator} />
        </View>
      );
    }
    if (item.type === 'player') {
      return renderPlayerRaw(item.player);
    }
    return null;
  };

  // Render item para jogador "raw"
  const renderPlayerRaw = (playerObj) => {
    const assignedTime = playerAssignments[playerObj._internalId];
    const isInSelected = assignedTime === selectedTimeIndex;
    const isLev = playerIsSetter[playerObj._internalId];
    const pillColor = getTimeColor(assignedTime);

    return (
      <View style={styles.playerItem}>
        <View style={{ flexDirection: 'column', maxWidth: '65%' }}>
          <View style={styles.playerNameContainer}>
            <Text style={styles.playerName}>
              {playerObj.nome}
              {isLev && <Text style={[styles.levText, { color: '#F44336' }]}> [LEV]</Text>}
            </Text>
            {playerObj.genero && (
              <View style={[
                styles.genderBadge,
                { backgroundColor: playerObj.genero === 'M' ? '#4A90E2' : '#E91E63' }
              ]}>
                <Text style={styles.genderText}>{playerObj.genero}</Text>
              </View>
            )}
          </View>
          {playerObj.temporario && (
            <Text style={styles.tempLabel}>Jogador Temporário</Text>
          )}
        </View>

        <View style={styles.toggleRow}>
          {assignedTime >= 0 && (
            <View style={[styles.teamPill, { backgroundColor: pillColor }]}>
              <Text style={styles.teamPillText}>
                Time {assignedTime + 1}
              </Text>
            </View>
          )}
          <Switch
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
            onValueChange={(val) => handleTogglePlayer(playerObj._internalId, val)}
            value={isInSelected}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!confirmed && (
        // Caso queira exibir algo antes de definir, mas no nosso fluxo
        // definimos playersPerTeam na tela anterior, então "confirmed" já vem true.
        <View style={styles.step1Container}>
          <Text style={styles.title}>Quantos jogadores por time?</Text>
          <View style={styles.optionsRow}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionButton,
                  playersPerTeam === opt && styles.optionButtonSelected,
                ]}
                onPress={() => setPlayersPerTeam(opt)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    playersPerTeam === opt && styles.optionButtonTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.infoText}>
            Jogadores confirmados: {allPlayers.length}
          </Text>
          <TouchableOpacity style={styles.confirmButton} onPress={() => setConfirmed(true)}>
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}

      {confirmed && (
        <>
          <Text style={styles.selectedTimeText}>
            Selecionando Time {selectedTimeIndex + 1}
          </Text>

          <ScrollView
            horizontal
            style={styles.timesBar}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            showsHorizontalScrollIndicator={false}
          >
            {Array.from({ length: numTeams }).map((_, idx) => {
              const count = countAssigned(idx, playerAssignments);
              const isSelected = idx === selectedTimeIndex;
              const color = getTimeColor(idx);

              return (
                <TouchableOpacity
                  key={`time-${idx}`}
                  style={[
                    styles.timeButton,
                    { borderColor: color },
                    isSelected && { backgroundColor: color },
                  ]}
                  onPress={() => handleSelectTime(idx)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      isSelected ? { color: '#FFF' } : { color },
                    ]}
                  >
                    Time {idx + 1}
                  </Text>
                  <Text style={{ fontSize: 12, color: isSelected ? '#FFF' : '#999' }}>
                    ({count}/{capacityOf(idx)})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.playersListContainer}>
            <Text style={styles.playersListTitle}>Jogadores</Text>
            <FlatList
              data={displayList.length > 0 ? displayList : allPlayers}
              keyExtractor={(item, index) => {
                if (item.type === 'header') {
                  return `header-${item.timeIndex}-${index}`;
                }
                if (item.type === 'player') {
                  return item.player._internalId;
                }
                return item._internalId || `fallback-${index}`;
              }}
              renderItem={
                displayList.length > 0
                  ? renderItemOrganized
                  : ({ item }) => renderPlayerRaw(item)
              }
              style={{ marginTop: 10 }}
            />
          </View>

          <View style={styles.footerButtonsContainer}>
            <TouchableOpacity
              style={[styles.footerButton, { marginRight: 6 }]}
              onPress={handleOrganizarLista}
            >
              <Ionicons name="reorder-four-outline" size={20} color="#FFF" />
              <Text style={styles.footerButtonText}>Organizar Lista</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, { marginLeft: 6 }]}
              onPress={handleCopyDistribution}
            >
              <Ionicons name="clipboard-outline" size={20} color="#FFF" />
              <Text style={styles.footerButtonText}>Copiar Lista</Text>
            </TouchableOpacity>
          </View>

          {currentTeamFull && (
            <View style={styles.setterContainer}>
              <TouchableOpacity style={styles.setterButton} onPress={handleOpenSetterModal}>
                <Ionicons name="ribbon-outline" size={18} color="#FFF" />
                <Text style={styles.setterButtonText}>Definir Levantadores</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Modal para levantar a galera */}
      <Modal visible={showSetterModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Definir Levantadores</Text>
            <Text style={styles.modalText}>
              Selecione os jogadores do Time {selectedTimeIndex + 1} que serão levantadores:
            </Text>
            <ScrollView style={{ maxHeight: 300, width: '100%' }}>
              {getPlayersOfSelectedTeam().map((player) => {
                const isLev = playerIsSetter[player._internalId];
                return (
                  <TouchableOpacity
                    key={player._internalId}
                    style={styles.levRow}
                    onPress={() => handleToggleLevantador(player._internalId)}
                  >
                    <Ionicons
                      name={isLev ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isLev ? '#4CAF50' : '#ccc'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 16, color: '#333' }}>{player.nome}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#999' }]}
                onPress={handleCloseSetterModal}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Caso ainda tivesse popUp de times desfalcados neste fluxo (normalmente já tratado antes) */}
      <Modal visible={showPopUp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {allPlayers.length} jogadores confirmados.
            </Text>
            <Text style={styles.modalText}>
              Faltam {needExtraPlayers} para formar todos os times completos.
              Deseja criar jogadores temporários?
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => {}}
              >
                <Text style={styles.modalButtonText}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={() => {}}
              >
                <Text style={styles.modalButtonText}>Não, deixar desfalcado</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  step1Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  optionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 6,
  },
  optionButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  optionButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  optionButtonTextSelected: {
    color: '#FFF',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  selectedTimeText: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  timesBar: {
    marginTop: 35,
    marginHorizontal: 8,
    maxHeight: 60,
  },
  timeButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  playersListContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 10,
  },
  playersListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  playerItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  genderText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  levText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tempLabel: {
    marginTop: 2,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#FFC107',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamPill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  teamPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  footerButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  headerContainer: {
    marginTop: 10,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#ccc',
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 60,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  levRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  setterButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  setterButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
});

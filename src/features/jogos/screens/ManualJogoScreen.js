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

/* ===========================================================
   Função para retornar a cor de cada time
   =========================================================== */
function getTimeColor(timeIndex) {
  if (timeIndex < 0) return '#999'; // se -1 (sem time)
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
  // Ajuste AQUI: leia "players" em vez de "amigosSelecionados"
  const { players = [], fluxo = 'manual' } = route.params || {};

  // Quantos jogadores por time
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const options = [2, 3, 4, 5, 6];

  // Se confirmamos a quantidade
  const [confirmed, setConfirmed] = useState(false);
  // Quantos times => calculado
  const [numTeams, setNumTeams] = useState(0);

  // Se a conta não bate
  const [needExtraPlayers, setNeedExtraPlayers] = useState(0);
  const [showPopUp, setShowPopUp] = useState(false);
  // Se decidimos criar time com -1 jogador no final
  const [timeWithOneLess, setTimeWithOneLess] = useState(false);

  // Lista de jogadores e atribuição de time
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerAssignments, setPlayerAssignments] = useState({});

  // Qual time está selecionado
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);

  // Lista exibida após organizar
  const [displayList, setDisplayList] = useState([]);

  // Marca se jogador é levantador
  const [playerIsSetter, setPlayerIsSetter] = useState({});

  // Modal para definir levantador
  const [showSetterModal, setShowSetterModal] = useState(false);

  /* ===========================================================
     1) Inicializa os jogadores a partir de "players"
     =========================================================== */
  useEffect(() => {
    const initialAssignments = {};
    const initialSetters = {};

    // Monta array de jogadores com ID interno
    const processed = players.map((player, index) => {
      const realId = player.id_usuario ?? player.id ?? `temp-${index}`;
      return {
        ...player,
        _internalId: String(realId),
        temporario: !!player.temporario, // garante a prop 'temporario'
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

  /* ===========================================================
     2) Confirmar quantos jogadores por time
        -> Se leftover <=2, revezamento
        -> Se leftover >=3, popup p/ criar temporários
     =========================================================== */
  const handleConfirmPlayersPerTeam = () => {
    const totalPlayers = allPlayers.length;
    const nFullTeams = Math.floor(totalPlayers / playersPerTeam);
    const leftover = totalPlayers - nFullTeams * playersPerTeam;

    let nTeams = nFullTeams;
    if (leftover > 0) {
      nTeams += 1;
    }
    setNumTeams(nTeams);

    if (leftover === 0) {
      // times exatos
      setConfirmed(true);
      return;
    }
    if (leftover <= 2 && leftover > 0) {
      Alert.alert(
        'Excedente/Revezar',
        `Há ${leftover} jogador(es) sobrando. Poderá revezar com os times formados.`
      );
      setConfirmed(true);
    } else {
      // leftover >=3 => abre popup
      const diff = playersPerTeam - leftover; // quantos faltam p/ completar
      setNeedExtraPlayers(diff);
      setShowPopUp(true);
    }
  };

  /* ===========================================================
     3) Criar jogador(es) temporário(s) => p/ completar times
     =========================================================== */
  const handleCreateTempPlayers = () => {
    const newPlayers = [];
    for (let i = 0; i < needExtraPlayers; i++) {
      const rIndex = Math.floor(Math.random() * ANIMALS_LIST.length);
      const animal = ANIMALS_LIST[rIndex] || 'Animal';

      const tempId = -(Math.floor(Math.random() * 100000 + 1));
      newPlayers.push({
        _internalId: `temp-${Math.abs(tempId)}`,
        nome: `Temp ${animal}`,
        temporario: true,
      });
    }

    const updatedAll = [...allPlayers, ...newPlayers];
    setAllPlayers(updatedAll);

    const updatedAssignments = { ...playerAssignments };
    const updatedSetters = { ...playerIsSetter };

    newPlayers.forEach((p) => {
      updatedAssignments[p._internalId] = -1;
      updatedSetters[p._internalId] = false;
    });

    setPlayerAssignments(updatedAssignments);
    setPlayerIsSetter(updatedSetters);

    setShowPopUp(false);
    setConfirmed(true);
  };

  /* ===========================================================
     4) Não criar temporário => time desfalcado
     =========================================================== */
  const handleTimeWithOneLess = () => {
    setTimeWithOneLess(true);
    setShowPopUp(false);
    setConfirmed(true);
  };

  /* ===========================================================
     5) Selecionar time
     =========================================================== */
  const handleSelectTime = (timeIndex) => {
    setSelectedTimeIndex(timeIndex);
  };

  /* ===========================================================
     6) Toggle do jogador => se time encher, auto-avança
     =========================================================== */
  const handleTogglePlayer = (playerKey, newVal) => {
    setPlayerAssignments((prev) => {
      const currentTime = prev[playerKey];
      if (newVal) {
        // Atribui ao time selecionado
        if (currentTime === selectedTimeIndex) return prev; // já está no time
        if (isTeamFull(selectedTimeIndex, prev)) {
          Alert.alert('Time Cheio', `Time ${selectedTimeIndex + 1} já está completo!`);
          return prev;
        }
        const newObj = { ...prev, [playerKey]: selectedTimeIndex };
        // Se encheu o time, auto-avança
        if (countAssigned(selectedTimeIndex, newObj) >= capacityOf(selectedTimeIndex)) {
          if (selectedTimeIndex < numTeams - 1) {
            setTimeout(() => setSelectedTimeIndex((old) => old + 1), 300);
          }
        }
        return newObj;
      } else {
        // Remove
        if (currentTime === selectedTimeIndex) {
          return { ...prev, [playerKey]: -1 };
        }
        return prev;
      }
    });
  };

  const countAssigned = (timeIndex, assignmentsObj) => {
    return Object.values(assignmentsObj).filter((t) => t === timeIndex).length;
  };

  const isTeamFull = (timeIndex, assignmentsObj) => {
    const assignedCount = countAssigned(timeIndex, assignmentsObj);
    if (timeWithOneLess && timeIndex === numTeams - 1 && needExtraPlayers > 0) {
      // último time com -1
      const realCap = playersPerTeam - needExtraPlayers;
      return assignedCount >= realCap;
    }
    return assignedCount >= playersPerTeam;
  };

  /* ===========================================================
     7) Copiar Lista
     =========================================================== */
  const handleCopyDistribution = async () => {
    let text = '';
    const teams = generateTeamsArray();
    teams.forEach((team, idx) => {
      text += `Time ${idx + 1} (${team.jogadores.length}/${capacityOf(idx)})\n`;
      if (team.jogadores.length === 0) {
        text += '  - (Nenhum jogador)\n';
      } else {
        team.jogadores.forEach((j) => {
          const lev = playerIsSetter[j._internalId] ? ' [LEV]' : '';
          const tempLabel = j.temporario ? ' (Jogador Temporário)' : '';
          text += `  - ${j.nome}${lev}${tempLabel}\n`;
        });
      }
      text += '\n';
    });

    // Sobras
    const leftover = allPlayers.length % playersPerTeam;
    if (leftover === 0) {
      text += 'Observações:\n - Times completos.\n';
    } else if (leftover <= 2) {
      text += 'Observações:\n - 1 ou 2 jogadores em excesso => revezamento.\n';
    } else {
      text += `Observações:\n - Faltou ${playersPerTeam - leftover} para completar.\n`;
    }

    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Sucesso', 'Lista copiada para a área de transferência!');
    } catch {
      Alert.alert('Erro', 'Não foi possível copiar o texto.');
    }
  };

  /* ===========================================================
     8) Organizar Lista => gera displayList c/ headers
     =========================================================== */
  const handleOrganizarLista = () => {
    const sorted = [...allPlayers];
    // Ordena por time (quem está -1 fica no final)
    sorted.sort((a, b) => {
      const aTime = playerAssignments[a._internalId];
      const bTime = playerAssignments[b._internalId];
      if (aTime === bTime) return 0;
      if (aTime === -1) return 1; // sem time vai para o final
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

  /* ===========================================================
     9) Selecionar Levantador => modal
     =========================================================== */
  const currentTeamFull = isTeamFull(selectedTimeIndex, playerAssignments);

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

  // Gera times final
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

  // Capacidade real => se timeWithOneLess e é o ultimo time
  const capacityOf = (timeIndex) => {
    if (timeWithOneLess && timeIndex === numTeams - 1 && needExtraPlayers > 0) {
      return playersPerTeam - needExtraPlayers;
    }
    return playersPerTeam;
  };

  // Se displayList tá vazio => render normal; senão => "header/player"
  const dataToRender = displayList.length > 0 ? displayList : allPlayers;

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
            <View style={[
              styles.genderBadge,
              { backgroundColor: playerObj.genero === 'M' ? '#4A90E2' : '#E91E63' }
            ]}>
              <Text style={styles.genderText}>{playerObj.genero}</Text>
            </View>
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
      {/* Passo 1 => escolher quantos por time */}
      {!confirmed && (
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
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPlayersPerTeam}>
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Se já confirmou => exibe times */}
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

          {/* Lista principal */}
          <View style={styles.playersListContainer}>
            <Text style={styles.playersListTitle}>Jogadores</Text>

            <FlatList
              data={dataToRender}
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

          {/* Botões rodapé */}
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

          {/* Botão de Selecionar Levantador (se time cheio) */}
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

      {/* Modal p/ levantador */}
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

      {/* Modal se sobrar 3+ => criar temporários */}
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
                onPress={handleCreateTempPlayers}
              >
                <Text style={styles.modalButtonText}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={handleTimeWithOneLess}
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

/* ===========================================================
   ESTILOS
   =========================================================== */
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
    color: '#FFC107', // amarelo
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

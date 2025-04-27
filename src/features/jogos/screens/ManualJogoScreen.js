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

// --------------------------
// Tema / Cores
// --------------------------
const PRIMARY_COLOR = '#FB8C00';  // Laranja principal
const SECONDARY_COLOR = '#FFF3E0'; // Fundo claro alaranjado
const ACCENT_COLOR = '#FFB74D';   // Alaranjado de destaque
const TEXT_COLOR = '#424242';     // Texto principal

// Calcula o número de times
function computeNumTeams(totalPlayers, playersPerTeam) {
  return Math.ceil(totalPlayers / playersPerTeam);
}

// Cor de cada time
function getTimeColor(timeIndex) {
  if (timeIndex < 0) return '#999';
  const colors = [
    '#EF4444',
    '#10B981',
    '#3B82F6',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
  ];
  return colors[timeIndex % colors.length];
}

// Mapeamento de cor para fundo do card (tom claro)
function getTeamCardBackground(timeIndex) {
  if (timeIndex < 0) return '#FFF';
  const teamColor = getTimeColor(timeIndex);
  const mapping = {
    '#EF4444': '#FDECEA',
    '#10B981': '#E7F8F1',
    '#3B82F6': '#E0F2FE',
    '#F59E0B': '#FFF4E5',
    '#8B5CF6': '#F3EFFF',
    '#EC4899': '#FCE4EC',
    '#14B8A6': '#E0F7F5',
  };
  return mapping[teamColor] || '#FFF';
}

export default function ManualJogoScreen({ route }) {
  const { players = [], fluxo = 'manual' } = route.params || {};

  const [step, setStep] = useState('definirLev');
  const [playersPerTeam, setPlayersPerTeam] = useState(route.params?.playersPerTeam || 4);
  const [confirmed, setConfirmed] = useState(false);
  const [numTeams, setNumTeams] = useState(0);

  const [allPlayers, setAllPlayers] = useState([]);
  const [playerAssignments, setPlayerAssignments] = useState({});
  const [playerIsSetter, setPlayerIsSetter] = useState({});

  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [displayList, setDisplayList] = useState([]);
  const [showSetterModal, setShowSetterModal] = useState(false);

  const computedMaxLevs = computeNumTeams(allPlayers.length, playersPerTeam);

  // --------------------------
  // Carregamento inicial
  // --------------------------
  useEffect(() => {
    const assignments = {};
    const setters = {};
    const processed = players.map((player, index) => {
      const realId = player.id_usuario ?? player.id ?? `temp-${index}`;
      return { ...player, _internalId: String(realId) };
    });
    processed.forEach((p) => {
      assignments[p._internalId] = -1;
      setters[p._internalId] = false;
    });
    setAllPlayers(processed);
    setPlayerAssignments(assignments);
    setPlayerIsSetter(setters);
  }, [players]);

  useEffect(() => {
    const total = allPlayers.length;
    const teams = computeNumTeams(total, playersPerTeam);
    setNumTeams(teams);
  }, [allPlayers, playersPerTeam]);

  // --------------------------
  // Helpers
  // --------------------------
  const countAssigned = (timeIndex, obj = playerAssignments) =>
    Object.values(obj).filter((t) => t === timeIndex).length;

  const capacityOf = (timeIndex) => playersPerTeam;

  const isTeamFull = (timeIndex, obj = playerAssignments) =>
    countAssigned(timeIndex, obj) >= capacityOf(timeIndex);

  const handleSelectTime = (timeIndex) => setSelectedTimeIndex(timeIndex);

  // --------------------------
  // Jogador: toggle no time
  // --------------------------
  const handleTogglePlayer = (playerKey, newVal) => {
    setPlayerAssignments((prev) => {
      const currentTime = prev[playerKey];
      if (newVal) {
        if (currentTime === selectedTimeIndex) return prev;
        if (isTeamFull(selectedTimeIndex, prev)) {
          Alert.alert('Time Cheio', `Time ${selectedTimeIndex + 1} já está completo!`);
          return prev;
        }
        const updated = { ...prev, [playerKey]: selectedTimeIndex };
        if (
          countAssigned(selectedTimeIndex, updated) >= capacityOf(selectedTimeIndex) &&
          selectedTimeIndex < numTeams - 1
        ) {
          setTimeout(() => setSelectedTimeIndex((x) => x + 1), 300);
        }
        return updated;
      } else {
        if (currentTime === selectedTimeIndex) {
          return { ...prev, [playerKey]: -1 };
        }
        return prev;
      }
    });
  };

  // --------------------------
  // Jogador: toggle levantador
  // --------------------------
  const handleToggleLevantador = (playerId) => {
    setPlayerIsSetter((prev) => {
      const wasLev = prev[playerId];
      const countLev = Object.values(prev).filter(Boolean).length;
      if (!wasLev && countLev >= computedMaxLevs) {
        Alert.alert(
          'Limite de levantadores',
          `Você só pode escolher até ${computedMaxLevs} levantador(es).`
        );
        return prev;
      }
      return { ...prev, [playerId]: !wasLev };
    });
  };

  // --------------------------
  // Confirmar levantadores
  // --------------------------
  const handleConfirmLevs = () => {
    const selectedSetters = allPlayers.filter((p) => playerIsSetter[p._internalId]);
    if (selectedSetters.length !== computedMaxLevs) {
      Alert.alert(
        'Atenção',
        `Selecione exatamente ${computedMaxLevs} levantador(es).`
      );
      return;
    }
    const newAssignments = { ...playerAssignments };
    selectedSetters.forEach((player, index) => {
      newAssignments[player._internalId] = index;
    });
    setPlayerAssignments(newAssignments);
    setStep('montarTimes');
    setConfirmed(true);
  };

  // --------------------------
  // Modal (redefinir levantadores)
  // --------------------------
  const getPlayersOfSelectedTeam = () =>
    allPlayers.filter((p) => playerAssignments[p._internalId] === selectedTimeIndex);

  const handleOpenSetterModal = () => {
    if (!isTeamFull(selectedTimeIndex, playerAssignments)) {
      Alert.alert('Atenção', 'O time atual ainda não está completo!');
      return;
    }
    setShowSetterModal(true);
  };
  const handleCloseSetterModal = () => setShowSetterModal(false);

  // --------------------------
  // ORGANIZAR lista (lev no topo)
  // --------------------------
  const handleOrganizarLista = () => {
    const sorted = [...allPlayers];
    sorted.sort((a, b) => {
      const aTime = playerAssignments[a._internalId];
      const bTime = playerAssignments[b._internalId];
      if (aTime === bTime) {
        const aLev = playerIsSetter[a._internalId] ? 1 : 0;
        const bLev = playerIsSetter[b._internalId] ? 1 : 0;
        return bLev - aLev;
      }
      if (aTime < 0) return 1;
      if (bTime < 0) return -1;
      return aTime - bTime;
    });

    let arr = [];
    let lastTime = null;
    for (let p of sorted) {
      const t = playerAssignments[p._internalId];
      if (t !== lastTime) {
        // Se t < 0, mostra "Pessoas"; caso contrário, "Time X"
        arr.push({ type: 'header', timeIndex: t });
        lastTime = t;
      }
      arr.push({ type: 'player', player: p });
    }
    setDisplayList(arr);
    setAllPlayers(sorted);
  };

  // --------------------------
  // Copiar distribuição
  // --------------------------
  const generateTeamsArray = () => {
    let result = [];
    for (let i = 0; i < numTeams; i++) {
      const playersInTeam = allPlayers.filter(
        (p) => playerAssignments[p._internalId] === i
      );
      playersInTeam.sort((a, b) => {
        const aLev = playerIsSetter[a._internalId] ? 1 : 0;
        const bLev = playerIsSetter[b._internalId] ? 1 : 0;
        return bLev - aLev;
      });
      result.push({ timeIndex: i, jogadores: playersInTeam });
    }
    return result;
  };

  const handleCopyDistribution = async () => {
    try {
      const teams = generateTeamsArray();
      let text = '';
      teams.forEach((team, idx) => {
        text += `Time ${idx + 1}:\n`;
        team.jogadores.forEach((j) => {
          text += `- ${j.nome}${playerIsSetter[j._internalId] ? ' (levantador)' : ''}\n`;
        });
        text += '\n';
      });
      text += 'Observações:\n';
      const allAssigned = allPlayers.every(p => playerAssignments[p._internalId] !== -1);
      const allFull = teams.every(t => t.jogadores.length === playersPerTeam);
      if (!allAssigned) {
        text += '- Há jogadores sem time.\n';
      } else if (allFull) {
        text += '- Times completos.\n';
      } else {
        text += '- Alguns times estão incompletos.\n';
      }
      await Clipboard.setStringAsync(text);
      Alert.alert('Sucesso', 'Lista copiada para a área de transferência!');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível copiar o texto.');
    }
  };

  // --------------------------
  // Render do jogador no step "montarTimes"
  // --------------------------
  const renderPlayerItem = (playerObj) => {
    const assignedTime = playerAssignments[playerObj._internalId];
    const isInSelected = assignedTime === selectedTimeIndex;
    const isLev = playerIsSetter[playerObj._internalId];

    const teamColor = assignedTime >= 0 ? getTimeColor(assignedTime) : '#EEE';
    const backgroundColor =
      assignedTime >= 0 ? getTeamCardBackground(assignedTime) : '#FFF';

    const cardStyle = [
      styles.playerCard,
      assignedTime >= 0 && { borderColor: teamColor, backgroundColor: backgroundColor },
    ];

    return (
      <View style={cardStyle}>
        <View style={styles.playerCardInfo}>
          {playerObj.genero && (
            <Ionicons
              name={playerObj.genero === 'F' ? 'female-outline' : 'male-outline'}
              size={20}
              color={playerObj.genero === 'F' ? '#e91e63' : '#4a90e2'}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={styles.playerCardName}>
            {playerObj.nome}
            {isLev && ' (levantador)'}
          </Text>
        </View>
        <View style={styles.playerCardActions}>
          {assignedTime >= 0 && (
            <View style={[styles.teamPill, { backgroundColor: teamColor }]}>
              <Text style={styles.teamPillText}>T{assignedTime + 1}</Text>
            </View>
          )}
          <Switch
            trackColor={{ false: '#bbb', true: PRIMARY_COLOR }}
            thumbColor="#fff"
            onValueChange={(val) => handleTogglePlayer(playerObj._internalId, val)}
            value={isInSelected}
            style={{ marginLeft: 6 }}
          />
        </View>
      </View>
    );
  };

  // Render item organizado (header / player)
  const renderItemOrganized = ({ item }) => {
    if (item.type === 'header') {
      const t = item.timeIndex;
      return (
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: getTimeColor(t) }]}>
            {t < 0 ? 'Pessoas' : `Time ${t + 1}`}
          </Text>
          <View style={styles.headerSeparator} />
        </View>
      );
    }
    if (item.type === 'player') {
      return renderPlayerItem(item.player);
    }
    return null;
  };

  // --------------------------
  // Layout principal
  // --------------------------
  return (
    <View style={styles.container}>
      {/* Etapa 1: Definir Levantadores */}
      {step === 'definirLev' && (
        <>
          <View style={styles.appBar}>
            <Ionicons name="people" size={24} color="#FFF" />
            <Text style={styles.appBarTitle}>Definir Levantadores</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.screenContent}>
            <Text style={styles.countText}>
              Levantadores selecionados: {Object.values(playerIsSetter).filter(Boolean).length} / {computedMaxLevs}
            </Text>
            <Text style={styles.subtitleText}>Jogadores confirmados: {players.length}</Text>
            <Text style={styles.subtitleText}>
              Tamanho dos times: {playersPerTeam}{' '}
              (Possíveis times: {computeNumTeams(players.length, playersPerTeam)})
            </Text>

            <ScrollView style={{ flex: 1, marginVertical: 12 }}>
              {allPlayers.map((p) => {
                const isLev = playerIsSetter[p._internalId];
                return (
                  <TouchableOpacity
                    key={p._internalId}
                    style={[styles.cardItem, isLev && styles.cardItemSelected]}
                    onPress={() => handleToggleLevantador(p._internalId)}
                  >
                    <Ionicons name="person" size={22} color="#333" style={{ marginRight: 8 }} />
                    <Text style={styles.cardItemText}>
                      {p.nome}{isLev && ' (levantador)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmLevs}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Etapa 2: Montar Times */}
      {step === 'montarTimes' && (
        <>
          <View style={styles.appBar}>
            <Ionicons name="people-outline" size={24} color="#FFF" />
            <Text style={styles.appBarTitle}>Montar Times</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.screenContent}>
            <Text style={styles.selectedTimeText}>
              Selecione jogadores para o Time {selectedTimeIndex + 1} (máx: {playersPerTeam})
            </Text>

            <ScrollView
              horizontal
              style={styles.timesBar}
              contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 8 }}
              showsHorizontalScrollIndicator={false}
            >
              {Array.from({ length: numTeams }).map((_, idx) => {
                const count = countAssigned(idx, playerAssignments);
                const selected = idx === selectedTimeIndex;
                const color = getTimeColor(idx);

                return (
                  <TouchableOpacity
                    key={`time-${idx}`}
                    style={[
                      styles.timeButton,
                      { borderColor: color },
                      selected && { backgroundColor: color },
                    ]}
                    onPress={() => handleSelectTime(idx)}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        selected ? { color: '#FFF' } : { color },
                      ]}
                    >
                      Time {idx + 1}
                    </Text>
                    <Text
                      style={[
                        styles.timeButtonSub,
                        selected ? { color: '#FFF' } : { color: '#999' },
                      ]}
                    >
                      {count}/{playersPerTeam}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ flex: 1, marginTop: 8 }}>
              <FlatList
                data={displayList.length ? displayList : allPlayers}
                keyExtractor={(item, index) => {
                  if (item.type === 'header') return `hdr-${item.timeIndex}-${index}`;
                  if (item.type === 'player') return item.player._internalId;
                  return `item-${index}`;
                }}
                renderItem={
                  displayList.length
                    ? renderItemOrganized
                    : ({ item }) => renderPlayerItem(item)
                }
              />
            </View>

            <View style={styles.footerButtonsContainer}>
              <TouchableOpacity
                style={[styles.footerButton, { marginRight: 6 }]}
                onPress={handleOrganizarLista}
              >
                <Ionicons
                  name="reorder-four"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.footerButtonText}>Organizar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerButton, { marginLeft: 6 }]}
                onPress={handleCopyDistribution}
              >
                <Ionicons
                  name="clipboard"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.footerButtonText}>Copiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Modal (re)definir levantadores no time X */}
      <Modal visible={showSetterModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Definir Levantadores</Text>
            <Text style={styles.modalText}>Time {selectedTimeIndex + 1}</Text>
            <ScrollView style={{ maxHeight: 300, width: '100%' }}>
              {getPlayersOfSelectedTeam().map((p) => {
                const isLev = playerIsSetter[p._internalId];
                return (
                  <TouchableOpacity
                    key={p._internalId}
                    style={styles.modalLevItem}
                    onPress={() => handleToggleLevantador(p._internalId)}
                  >
                    <Ionicons
                      name={isLev ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isLev ? PRIMARY_COLOR : '#ccc'}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={{ fontSize: 16, color: '#333' }}>{p.nome}</Text>
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
    </View>
  );
}

// --------------------------
// Estilos (inspirado no design alaranjado)
// --------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECONDARY_COLOR,
  },
  appBar: {
    height: 56,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  appBarTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -10,
    padding: 16,
  },
  countText: {
    fontSize: 14,
    color: TEXT_COLOR,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#666',
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD180',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  cardItemSelected: {
    backgroundColor: '#FFE0B2',
    borderColor: '#FFB74D',
  },
  cardItemText: {
    fontSize: 16,
    color: TEXT_COLOR,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedTimeText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
    color: TEXT_COLOR,
    marginBottom: 6,
  },
  timesBar: {
    marginTop: 4,
    maxHeight: 60,
  },
  timeButton: {
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
  timeButtonSub: {
    fontSize: 12,
    marginTop: 2,
  },
  playerCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginVertical: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: '70%',
  },
  playerCardName: {
    fontSize: 15,
    color: TEXT_COLOR,
  },
  playerCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 4,
  },
  teamPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  footerButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  headerContainer: {
    marginTop: 10,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#ccc',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '88%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 60,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalLevItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
});

// src/features/jogo/components/TimesBalanceados.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '../../../services/api';

import TeamCard from '../components/TeamCard';
import ReservasBox from '../components/ReservasBox';
import SugestoesBox from '../components/SugestoesBox';
import ModalMoverJogador from '../components/ModalMoverJogador';
import ModalTimeLevel from '../components/ModalTimeLevel';
import ModalRevezamento from '../components/ModalRevezamento';
import ModalJogadorDetalhes from '../components/ModalJogadorDetalhes';
import Toast from '../components/Toast';

import useTeamManagement from '../hooks/useTeamManagement';
import usePDFExport from '../hooks/usePDFExport';
import useImageExport from '../hooks/useImageExport';
import useToast from '../hooks/useToast';

import styles from '../styles/TimesBalanceados.styles';

// =================================================
// Helpers para cálculo de médias
// =================================================
const truncarNome = (nome = '') => {
  const partes = nome.trim().split(/\s+/);
  if (partes.length > 2) return partes[0] + ' ' + partes[1];
  return nome;
};

const calcularMedias = (jogadores = []) => {
  if (!jogadores.length) return { passe: 0, ataque: 0, levantamento: 0 };
  let somaPasse = 0,
    somaAtaque = 0,
    somaLev = 0;
  jogadores.forEach((j) => {
    somaPasse += j.passe;
    somaAtaque += j.ataque;
    somaLev += j.levantamento;
  });
  const n = jogadores.length;
  return {
    passe: Number((somaPasse / n).toFixed(1)),
    ataque: Number((somaAtaque / n).toFixed(1)),
    levantamento: Number((somaLev / n).toFixed(1)),
  };
};

// Descobre em qual time ou reservas o jogador está
const getTeamIndex = (jogador, times, reservas) => {
  for (let i = 0; i < times.length; i++) {
    if (times[i].jogadores.some((jg) => jg.id_usuario === jogador.id_usuario)) {
      return i;
    }
  }
  if (reservas.some((r) => r.id_usuario === jogador.id_usuario)) {
    return -1;
  }
  return null;
};

const TimesBalanceados = ({ route, navigation }) => {
  const {
    id_jogo,
    id_usuario_organizador,
    times: initialTimes = [],
    reservas: initialReservas = [],
    rotacoes: initialRotacoes = [],
    fluxo = 'offline',
    tamanho_time = 0, // Usado para identificar se há "time desfalcado"
  } = route.params || {};

  // =================================================
  // Prepara times e reservas iniciais
  // =================================================
  const formatJogadores = (jogs) =>
    (jogs || []).map((j) => ({
      ...j,
      nome: truncarNome(j.nome || ''),
      isMe: j.id_usuario === id_usuario_organizador,
      passe: Number(j.passe) || 3,
      ataque: Number(j.ataque) || 3,
      levantamento: Number(j.levantamento) || 3,
      posicao: j.posicao || 'Indefinida',
      altura: j.altura || 0,
      foto: j.foto || '',
      revezandoCom: j.revezandoCom || null,
      isLevantador: j.isLevantador || false,
      genero: j.genero || 'Indefinido',
    }));

  const [times, setTimes] = useState(
    initialTimes.map((t, idx) => {
      const jFormat = formatJogadores(t.jogadores);
      return {
        nomeTime: t.nomeTime || `Time ${idx + 1}`,
        jogadores: jFormat,
        averages: calcularMedias(jFormat),
      };
    })
  );
  const [exibirBarras, setExibirBarras] = useState(false);


  const [reservas, setReservas] = useState(
    initialReservas.map((r) => {
      return {
        ...r,
        nome: truncarNome(r.nome || ''),
        isMe: r.id_usuario === id_usuario_organizador,
        passe: Number(r.passe) || 3,
        ataque: Number(r.ataque) || 3,
        levantamento: Number(r.levantamento) || 3,
        posicao: r.posicao || 'Indefinida',
        altura: r.altura || 0,
        foto: r.foto || '',
        isLevantador: r.isLevantador || false,
        revezandoCom: r.revezandoCom || null,
        genero: r.genero || 'Indefinido',
      };
    })
  );

  // =================================================
  // Detecta Time Desfalcado
  // =================================================
  const isTimeDesfalcado = !!(
    tamanho_time > 0 &&
    reservas.length === tamanho_time - 1 &&
    reservas.length > 0
  );

  // Guardamos separadamente os jogadores do Time Desfalcado, se houver
  const [timeIncompleto, setTimeIncompleto] = useState([]);
  useEffect(() => {
    if (isTimeDesfalcado) {
      setTimeIncompleto([...reservas]);
    } else {
      setTimeIncompleto([]);
    }
  }, [isTimeDesfalcado, reservas]);

  // =================================================
  // Toast
  // =================================================
  const { toastMessage, showToast, triggerToast } = useToast();

  // =================================================
  // Hooks de movimentação
  // =================================================
  const [moveHistory, setMoveHistory] = useState([]);
  const { movePlayer, undoMove, moveHistory: globalMoveHistory } = useTeamManagement(
    times,
    setTimes,
    reservas,
    setReservas,
    moveHistory,
    setMoveHistory
  );

  // =================================================
  // PDF / Imagem
  // =================================================
  const { gerarPDF } = usePDFExport();
  const { exportToImage } = useImageExport();

  // =================================================
  // Modals
  // =================================================
  const [modalVisible, setModalVisible] = useState(false);
  const [playerToMove, setPlayerToMove] = useState(null);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [teamLevelModalVisible, setTeamLevelModalVisible] = useState(false);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(null);

  const [modalRevezarVisible, setModalRevezarVisible] = useState(false);
  const [selectedReserve, setSelectedReserve] = useState(null);

  // =================================================
  // Editar nome do time
  // =================================================
  const [isEditingIndex, setIsEditingIndex] = useState(null);
  const [tempTeamName, setTempTeamName] = useState('');

  // =================================================
  // Cálculos de médias e rotações
  // =================================================
  const recalcTeamAverages = (teamsArr) =>
    teamsArr.map((t) => ({
      ...t,
      averages: calcularMedias(t.jogadores),
    }));

  const atualizarTimesComAverages = (updatedTimes) => {
    setTimes(recalcTeamAverages(updatedTimes));
  };

  // *** Incluímos o timeIncompleto como um "time" extra na hora de gerar sugestões
  const calcularDist = (j1, j2) => {
    const difAlt = j1.altura - j2.altura;
    const difPasse = j1.passe - j2.passe;
    const difAtaque = j1.ataque - j2.ataque;
    const difLev = j1.levantamento - j2.levantamento;
    return Math.sqrt(
      difAlt * difAlt + difPasse * difPasse + difAtaque * difAtaque + difLev * difLev
    );
  };

  const gerarSugerirRotacoes = (teams, ress, topN = 2) => {
    const rot = [];
    ress.forEach((res) => {
      const sugeridos = [];
      teams.forEach((time, timeIndex) => {
        time.jogadores.forEach((jg) => {
          if (jg.revezandoCom) return;
          const isAlreadyUsed = teams.some((tm) =>
            tm.jogadores.some(
              (jj) => jj.revezandoCom && jj.revezandoCom.id_usuario === res.id_usuario
            )
          );
          if (isAlreadyUsed) return;
          const dist = calcularDist(res, jg);
          sugeridos.push({ time: timeIndex + 1, jogador: jg, distancia: dist });
        });
      });
      sugeridos.sort((a, b) => a.distancia - b.distancia);
      const topSugs = sugeridos.slice(0, Math.max(topN, 2)).map((s) => ({
        time: s.time,
        jogador: s.jogador,
        distancia: s.distancia.toFixed(2),
      }));
      rot.push({ reserva: res, sugeridos: topSugs });
    });
    return rot;
  };

  const [rotacoes, setRotacoes] = useState(initialRotacoes);

  // *** AQUI, se existir time desfalcado, adicionamos ele ao array de times
  const atualizarRotacoes = () => {
    // Gera um array final de "times" para as sugestões
    const finalTimes = isTimeDesfalcado
      ? [
          ...times,
          {
            // Monta um pseudoTime com .averages
            nomeTime: 'Time Desfalcado (Falta 1)',
            jogadores: timeIncompleto,
            averages: calcularMedias(timeIncompleto),
          },
        ]
      : times;

    // Recalcula as médias para os times "normais"
    setTimes(recalcTeamAverages(times));

    // Gera rotações
    const newRot = gerarSugerirRotacoes(finalTimes, reservas);
    setRotacoes(newRot);
  };

  // =================================================
  // Mover jogador (Modal)
  // =================================================
  const openMoveModal = (jogador, teamIndex) => {
    setPlayerToMove(jogador);
    setCurrentTeamIndex(teamIndex);
    setModalVisible(true);
  };
  const closeMoveModal = () => {
    setModalVisible(false);
    setPlayerToMove(null);
    setCurrentTeamIndex(null);
  };
  const handleMovePlayer = (targetTeamIndex) => {
    movePlayer(playerToMove, currentTeamIndex, targetTeamIndex, 'move');
    triggerToast(
      `${playerToMove.nome} foi movido para ${
        targetTeamIndex === -1 ? 'Reservas' : `Time ${targetTeamIndex + 1}`
      }`
    );
    closeMoveModal();
    atualizarRotacoes();
  };

  // =================================================
  // Modal Detalhes Jogador
  // =================================================
  const handleOpenPlayerDetail = (jogador) => {
    setSelectedPlayer(jogador);
    setDetailModalVisible(true);
  };
  const handleClosePlayerDetail = () => {
    setSelectedPlayer(null);
    setDetailModalVisible(false);
  };

  // =================================================
  // Revezamento
  // =================================================
  const openRevezamentoModal = (jogador) => {
    setSelectedReserve(jogador);
    setModalRevezarVisible(true);
  };
  const closeRevezamentoModal = () => {
    setSelectedReserve(null);
    setModalRevezarVisible(false);
  };

  const handleConfirmRevezamento = (timeIndex, jogadorAlvo) => {
    if (!selectedReserve) return;
    if (jogadorAlvo.revezandoCom) {
      triggerToast('Este jogador já está revezando com outra reserva.');
      return;
    }
    const isAlreadyUsed = times.some((tm) =>
      tm.jogadores.some(
        (jj) => jj.revezandoCom && jj.revezandoCom.id_usuario === selectedReserve.id_usuario
      )
    );
    if (isAlreadyUsed) {
      triggerToast('Este reserva já está revezando com outro jogador.');
      return;
    }
    movePlayer(jogadorAlvo, timeIndex, null, 'revezamento', {
      reserva: selectedReserve,
      timeIndex,
      jogadorAlvo,
    });
    triggerToast(
      `${selectedReserve.nome} está revezando agora com ${jogadorAlvo.nome} no ${
        times[timeIndex].nomeTime
      }`
    );
    closeRevezamentoModal();
    atualizarTimesComAverages(times);
    atualizarRotacoes();
  };

  const handleDesvincularRevezamento = (jogador) => {
    if (!jogador.revezandoCom) return;
    const timeIdx = getTeamIndex(jogador, times, reservas);
    if (timeIdx == null) return;

    movePlayer(jogador, timeIdx, null, 'desvincular', {
      jogador,
      reserva: jogador.revezandoCom,
      timeIndex: timeIdx,
    });
    triggerToast(
      `Revezamento entre ${jogador.nome} e ${jogador.revezandoCom.nome} foi desfeito!`
    );
    setDetailModalVisible(false);
    atualizarTimesComAverages(times);
    atualizarRotacoes();
  };

  const handleUndoRevezamento = () => {
    undoMove();
    atualizarTimesComAverages(times);
    atualizarRotacoes();
  };

  // =================================================
  // Modal Time Level
  // =================================================
  const handleOpenTeamLevel = (teamIndex) => {
    atualizarTimesComAverages(times);
    setSelectedTeamIndex(teamIndex);
    setTeamLevelModalVisible(true);
  };
  const handleCloseTeamLevel = () => {
    setSelectedTeamIndex(null);
    setTeamLevelModalVisible(false);
  };

  // =================================================
  // Editar nome do time
  // =================================================
  const handleEditTeamName = (index) => {
    setIsEditingIndex(index);
    if (index < times.length) {
      setTempTeamName(times[index]?.nomeTime || '');
    } else {
      // index = times.length => time desfalcado
      setTempTeamName('Time Desfalcado (Falta 1)');
    }
  };

  const saveTeamName = (index) => {
    if (index < times.length) {
      // Time normal
      const updatedTimes = [...times];
      updatedTimes[index].nomeTime = tempTeamName;
      setTimes(updatedTimes);
      setIsEditingIndex(null);
      setTempTeamName('');
      triggerToast('Nome do time atualizado!');
      atualizarRotacoes();
    } else {
      // Se quiser guardar um nome custom para o time desfalcado,
      // basta colocar num outro state. Ex:
      // setDesfalcadoName(tempTeamName);
      triggerToast('Nome do time (desfalcado) atualizado!');
      setIsEditingIndex(null);
      setTempTeamName('');
    }
  };

  // =================================================
  // Salvar & Voltar
  // =================================================
  const handleSalvarVoltar = async () => {
    try {
      const finalTimes = recalcTeamAverages(times);
      const payload = {
        id_jogo,
        id_usuario_organizador,
        times: finalTimes.map((t) => ({
          nomeTime: t.nomeTime,
          jogadores: t.jogadores.map((jj) => ({
            id_usuario: jj.id_usuario,
            passe: jj.passe,
            ataque: jj.ataque,
            levantamento: jj.levantamento,
            isLevantador: jj.isLevantador,
            revezandoCom:
              typeof jj.revezandoCom === 'object'
                ? jj.revezandoCom.id_usuario
                : jj.revezandoCom,
          })),
        })),
        // Reservas também são enviadas
        reservas: reservas.map((r) => ({
          id_usuario: r.id_usuario,
          passe: r.passe,
          ataque: r.ataque,
          levantamento: r.levantamento,
          isLevantador: r.isLevantador,
          revezandoCom:
            typeof r.revezandoCom === 'object' ? r.revezandoCom.id_usuario : r.revezandoCom,
        })),
      };

      const response = await api.post('/api/balanceamento/atualizar-times', payload);
      triggerToast(response.data.message || 'Times atualizados com sucesso!');

      navigation.navigate('LiveRoom', {
        id_jogo,
        times: response.data.times,
        reservas: response.data.reservas || reservas,
        rotacoes: response.data.rotacoes || rotacoes,
        fluxo,
        statusSala: 'andamento',
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erro ao atualizar os times.';
      Alert.alert('Erro', errorMsg);
      triggerToast(errorMsg);
    }
  };

  // =================================================
  // Gerar PDF
  // =================================================
  const handleGeneratePDF = async () => {
    try {
      const finalTimes = recalcTeamAverages(times);
      await gerarPDF(finalTimes, reservas, exibirBarras);
      triggerToast('PDF gerado e pronto para compartilhamento!');
    } catch (error) {
      triggerToast('Não foi possível gerar o PDF.');
    }
  };

  // =================================================
  // Toggle Levantador
  // =================================================
  const updatePlayerLevantador = (playerId, newStatus) => {
    // Aplica nos times "normais"
    const updatedTimes = times.map((time) => ({
      ...time,
      jogadores: time.jogadores.map((j) =>
        j.id_usuario === playerId ? { ...j, isLevantador: newStatus } : j
      ),
    }));
    setTimes(updatedTimes);

    // Se o jogador estiver no timeIncompleto, atualiza também
    if (isTimeDesfalcado) {
      const updatedIncompleto = timeIncompleto.map((j) =>
        j.id_usuario === playerId ? { ...j, isLevantador: newStatus } : j
      );
      setTimeIncompleto(updatedIncompleto);
    }
  };

  const handleToggleLevantador = (playerId, currentStatus) => {
    // Se quiser limitar a quantidade total de levantadores
    // (inclusive considerando time desfalcado), inclua a lógica aqui.
    updatePlayerLevantador(playerId, !currentStatus);
    triggerToast(
      `Jogador ${playerId} agora ${!currentStatus ? 'é' : 'não é'} Levantador`
    );
    atualizarRotacoes();
  };

  // =================================================
  // Geração de texto p/ clipboard
  // =================================================
  const gerarTextoParaClipboard = () => {
    try {
      const formatarJogadores = (jogadores) =>
        jogadores
          .sort((a, b) => (b.isLevantador ? 1 : 0) - (a.isLevantador ? 1 : 0))
          .map((jogador) => {
            let textoJogador = `${jogador.nome}`;
            if (jogador.isLevantador) {
              textoJogador += ' - Levantador';
            }
            if (jogador.revezandoCom) {
              textoJogador += ` - Revezando com ${jogador.revezandoCom.nome}`;
            }
            return textoJogador;
          })
          .join('\n');

      let textoFinal = '';

      // 1) Times
      times.forEach((time, idx) => {
        const nomeTime = time.nomeTime || `Time ${idx + 1}`;
        textoFinal += `*${nomeTime}*:\n`;
        textoFinal += formatarJogadores(time.jogadores);
        textoFinal += '\n\n';
      });

      // 2) Time Desfalcado ou Reservas
      if (isTimeDesfalcado && timeIncompleto.length > 0) {
        textoFinal += `*Time Desfalcado (Falta 1)*:\n`;
        textoFinal += formatarJogadores(timeIncompleto);
        textoFinal += '\n\n';
      } else {
        // Exibe reservas normais
        if (reservas && reservas.length > 0) {
          textoFinal += `*Reservas*:\n`;
          textoFinal += formatarJogadores(reservas);
          textoFinal += '\n\n';
        }
      }

      Clipboard.setStringAsync(textoFinal)
        .then(() => triggerToast('Texto copiado para a área de transferência!'))
        .catch(() => triggerToast('Não foi possível copiar o texto.'));
    } catch (error) {
      console.error('Erro ao gerar texto para clipboard:', error);
      triggerToast('Ocorreu um erro ao copiar o texto.');
    }
  };

  // =================================================
  // FlatList: Times + TimeIncompleto/Reservas + Sugestões
  // =================================================
  const flatListData = [
    { key: 'times' },
    { key: isTimeDesfalcado ? 'timeIncompleto' : 'reservas' },
    { key: 'sugestoes' },
  ];

  const renderFlatListItem = ({ item }) => {
    if (item.key === 'times') {
      return times.map((time, idx) => (
        <TeamCard
          key={`time-${idx}`}
          time={time}
          index={idx}
          onMovePress={openMoveModal}
          onPlayerPress={handleOpenPlayerDetail}
          onEditName={handleEditTeamName}
          isEditing={isEditingIndex === idx}
          tempTeamName={tempTeamName}
          setTempTeamName={setTempTeamName}
          saveTeamName={saveTeamName}
          onOpenTeamLevel={handleOpenTeamLevel}
          updatePlayerLevantador={updatePlayerLevantador}
          onRevezarPress={openRevezamentoModal}
          onDesvincularPress={handleDesvincularRevezamento}
        />
      ));
    }

    if (item.key === 'timeIncompleto') {
      // *** Gera um pseudoTime com averages
      const idx = times.length; // indice "extra"
      const pseudoTime = {
        nomeTime: 'Time Desfalcado (Falta 1)',
        jogadores: timeIncompleto,
        averages: calcularMedias(timeIncompleto), // *** CRUCIAL
      };
      return (
        <TeamCard
          key="timeIncompleto"
          time={pseudoTime}
          index={idx}
          onMovePress={openMoveModal}
          onPlayerPress={handleOpenPlayerDetail}
          // Permite editar nome, ver nível etc.:
          onEditName={handleEditTeamName}
          isEditing={isEditingIndex === idx}
          tempTeamName={tempTeamName}
          setTempTeamName={setTempTeamName}
          saveTeamName={saveTeamName}
          onOpenTeamLevel={handleOpenTeamLevel}
          updatePlayerLevantador={updatePlayerLevantador}
          onRevezarPress={openRevezamentoModal}
          onDesvincularPress={handleDesvincularRevezamento}
        />
      );
    }

    if (item.key === 'reservas') {
      return (
        <ReservasBox
          reservas={reservas}
          onMovePress={openRevezamentoModal}
          onPlayerPress={handleOpenPlayerDetail}
        />
      );
    }

    if (item.key === 'sugestoes') {
      return (
        <View style={styles.sugestoesBox}>
          <Text style={styles.sugestoesTitle}>Sugestões de Revezamento</Text>
          {rotacoes?.length > 0 ? (
            <SugestoesBox rotacoes={rotacoes} />
          ) : (
            <Text style={styles.noSuggestions}>Nenhuma sugestão disponível.</Text>
          )}
        </View>
      );
    }

    return null;
  };

  // =================================================
  // Render Principal
  // =================================================
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Times Equilibrados!</Text>

      {/* Botões PDF e Copiar Texto */}
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportButtonLeft} onPress={handleGeneratePDF}>
          <Ionicons name="document-text-outline" size={24} color="#FFF" />
          <Text style={styles.exportButtonText}>PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportButtonRight} onPress={gerarTextoParaClipboard}>
          <Ionicons name="clipboard-outline" size={24} color="#FFF" />
          <Text style={styles.exportButtonText}>Copiar</Text>
        </TouchableOpacity>
      </View>

      {/* Switch Barras Habilidades */}
      <View style={styles.barrasToggleContainer}>
        <Text style={styles.barrasToggleLabel}>Incluir Barras de Habilidades no PDF</Text>
        <Switch value={exibirBarras} onValueChange={setExibirBarras} />
      </View>

      <ViewShot style={{ flex: 1, marginBottom: 10 }} options={{ format: 'png', quality: 0.9 }}>
        {(!times || times.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Carregando dados...</Text>
          </View>
        ) : (
          <FlatList
            data={flatListData}
            renderItem={renderFlatListItem}
            keyExtractor={(it) => it.key}
            ListFooterComponent={<View style={{ height: 60 }} />}
          />
        )}
      </ViewShot>

      {/* Modal Mover */}
      <ModalMoverJogador
        visible={modalVisible}
        onClose={closeMoveModal}
        times={times}
        onMovePlayer={handleMovePlayer}
      />

      {/* Modal Detalhes Jogador */}
      <ModalJogadorDetalhes
        visible={detailModalVisible && selectedPlayer !== null}
        jogador={selectedPlayer}
        onClose={handleClosePlayerDetail}
        toggleLevantador={() =>
          handleToggleLevantador(selectedPlayer.id_usuario, selectedPlayer.isLevantador)
        }
        onMovePress={() =>
          openMoveModal(selectedPlayer, getTeamIndex(selectedPlayer, times, reservas))
        }
        onRevezarPress={() => {
          if (selectedPlayer?.revezandoCom) {
            handleDesvincularRevezamento(selectedPlayer);
          } else {
            openRevezamentoModal(selectedPlayer);
          }
        }}
        onDesvincularPress={handleDesvincularRevezamento}
      />

      {/* Modal TimeLevel */}
      <ModalTimeLevel
        visible={teamLevelModalVisible}
        onClose={handleCloseTeamLevel}
        time={
          selectedTeamIndex === null
            ? null
            : // Se for >= times.length, é o time desfalcado
            selectedTeamIndex < times.length
            ? times[selectedTeamIndex]
            : {
                nomeTime: 'Time Desfalcado (Falta 1)',
                jogadores: timeIncompleto,
                averages: calcularMedias(timeIncompleto), // *** Calcula média ao abrir
              }
        }
      />

      {/* Modal Revezamento */}
      <ModalRevezamento
        visible={modalRevezarVisible && selectedReserve != null}
        onClose={closeRevezamentoModal}
        times={times}
        reserva={selectedReserve}
        rotacoes={rotacoes}
        onConfirmRevezamento={handleConfirmRevezamento}
        onUndoRevezamento={handleUndoRevezamento}
      />

      <Toast message={toastMessage} visible={showToast} />

      {/* Botão Desfazer Global */}
      {globalMoveHistory.length > 0 && (
        <TouchableOpacity
          style={styles.undoGlobalButton}
          onPress={() => {
            undoMove();
            atualizarTimesComAverages(times);
            atualizarRotacoes();
          }}
        >
          <Ionicons name="arrow-undo-outline" size={20} color="#FFF" />
          <Text style={styles.undoGlobalButtonText}>Desfazer Última Ação</Text>
        </TouchableOpacity>
      )}

      {/* Botão de Salvar & Voltar */}
      <TouchableOpacity style={styles.saveBackButton} onPress={handleSalvarVoltar}>
        <Ionicons name="save-outline" size={20} color="#FFF" />
        <Text style={styles.saveBackButtonText}>Salvar &amp; Voltar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TimesBalanceados;

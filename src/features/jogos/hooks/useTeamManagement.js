// src/features/jogo/hooks/useTeamManagement.js

import { Alert } from 'react-native';

const useTeamManagement = (
  times,
  setTimes,
  reservas,
  setReservas,
  moveHistory,
  setMoveHistory
) => {
  const movePlayer = (
    jogador,
    fromTeamIndex,
    toTeamIndex,
    actionType,
    additionalData = {}
  ) => {
    let updatedTimes = [...times];
    let updatedReservas = [...reservas];

    switch (actionType) {
      case 'move': {
        // Remove jogador da origem
        if (fromTeamIndex === -1) {
          // Origem é reservas
          const idx = updatedReservas.findIndex(
            (r) => r.id_usuario === jogador.id_usuario
          );
          if (idx === -1) {
            Alert.alert('Erro', 'Jogador não encontrado nas reservas.');
            return;
          }
          updatedReservas.splice(idx, 1);
        } else {
          // Origem é um time
          if (!updatedTimes[fromTeamIndex]) {
            Alert.alert('Erro', 'Time de origem inválido.');
            return;
          }
          const idx = updatedTimes[fromTeamIndex].jogadores.findIndex(
            (jj) => jj.id_usuario === jogador.id_usuario
          );
          if (idx === -1) {
            Alert.alert('Erro', 'Jogador não encontrado no time de origem.');
            return;
          }
          updatedTimes[fromTeamIndex].jogadores.splice(idx, 1);
        }

        // Adiciona no destino
        if (toTeamIndex === -1) {
          updatedReservas.push(jogador);
        } else if (typeof toTeamIndex === 'number') {
          if (!updatedTimes[toTeamIndex]) {
            Alert.alert('Erro', 'Time de destino inválido.');
            return;
          }
          updatedTimes[toTeamIndex].jogadores.push(jogador);
        }

        setTimes(updatedTimes);
        setReservas(updatedReservas);

        // Registra a ação para permitir undo
        setMoveHistory([
          ...moveHistory,
          {
            type: 'move',
            jogador,
            fromTeamIndex,
            toTeamIndex,
          },
        ]);
        break;
      }

      case 'revezamento': {
        const { reserva, timeIndex, jogadorAlvo } = additionalData;
        if (!reserva || timeIndex == null || !jogadorAlvo) {
          Alert.alert('Erro', 'Dados insuficientes para revezar.');
          return;
        }

        // Marca revezandoCom no jogadorAlvo
        updatedTimes[timeIndex].jogadores = updatedTimes[timeIndex].jogadores.map((jg) => {
          if (jg.id_usuario === jogadorAlvo.id_usuario) {
            return { ...jg, revezandoCom: reserva };
          }
          return jg;
        });

        // Remove essa reserva do array de reservas
        const idx = updatedReservas.findIndex(
          (r) => r.id_usuario === reserva.id_usuario
        );
        if (idx !== -1) {
          updatedReservas.splice(idx, 1);
        }

        setTimes(updatedTimes);
        setReservas(updatedReservas);

        setMoveHistory([
          ...moveHistory,
          {
            type: 'revezamento',
            jogadorAlvo,
            reserva,
            timeIndex,
          },
        ]);
        break;
      }

      case 'desvincular': {
        // Desfaz o revezamento direto
        const { jogador: jg, reserva: rsv, timeIndex } = additionalData;
        if (!jg || !rsv || timeIndex == null) {
          Alert.alert('Erro', 'Dados insuficientes para desvincular.');
          return;
        }

        // Remove o link no jogador (timeIndex)
        updatedTimes[timeIndex].jogadores = updatedTimes[timeIndex].jogadores.map((jj) => {
          if (jj.id_usuario === jg.id_usuario) {
            return { ...jj, revezandoCom: null };
          }
          return jj;
        });

        // Retorna a reserva para "reservas" (sem duplicar)
        // Garante que ela não esteja já na lista:
        if (!updatedReservas.some((r) => r.id_usuario === rsv.id_usuario)) {
          updatedReservas.push(rsv);
        }

        setTimes(updatedTimes);
        setReservas(updatedReservas);

        setMoveHistory([
          ...moveHistory,
          {
            type: 'desvincular',
            jogador: jg,
            reserva: rsv,
            timeIndex,
          },
        ]);
        break;
      }

      default:
        Alert.alert('Erro', 'Ação desconhecida em movePlayer.');
        break;
    }
  };

  // Desfaz a última ação global
  const undoMove = () => {
    if (!moveHistory.length) {
      Alert.alert('Ops', 'Nenhum movimento para desfazer.');
      return;
    }
    const lastAction = moveHistory[moveHistory.length - 1];
    let updatedTimes = [...times];
    let updatedReservas = [...reservas];

    switch (lastAction.type) {
      case 'move': {
        const { jogador, fromTeamIndex, toTeamIndex } = lastAction;
        // Remove do destino
        if (toTeamIndex === -1) {
          const idx = updatedReservas.findIndex(
            (r) => r.id_usuario === jogador.id_usuario
          );
          if (idx !== -1) {
            updatedReservas.splice(idx, 1);
          }
        } else {
          const idx = updatedTimes[toTeamIndex].jogadores.findIndex(
            (jj) => jj.id_usuario === jogador.id_usuario
          );
          if (idx !== -1) {
            updatedTimes[toTeamIndex].jogadores.splice(idx, 1);
          }
        }

        // Volta ao local de origem
        if (fromTeamIndex === -1) {
          updatedReservas.push(jogador);
        } else {
          updatedTimes[fromTeamIndex].jogadores.push(jogador);
        }
        break;
      }

      case 'revezamento': {
        const { jogadorAlvo, reserva, timeIndex } = lastAction;

        // Remove a ligação
        updatedTimes[timeIndex].jogadores = updatedTimes[timeIndex].jogadores.map((jg) => {
          if (jg.id_usuario === jogadorAlvo.id_usuario) {
            return { ...jg, revezandoCom: null };
          }
          return jg;
        });
        // Retorna a reserva para "reservas" (se não existir já)
        if (!updatedReservas.some((r) => r.id_usuario === reserva.id_usuario)) {
          updatedReservas.push(reserva);
        }
        break;
      }

      case 'desvincular': {
        const { jogador, reserva, timeIndex } = lastAction;
        // Remove a reserva das reservas
        const idx = updatedReservas.findIndex(
          (r) => r.id_usuario === reserva.id_usuario
        );
        if (idx !== -1) {
          updatedReservas.splice(idx, 1);
        }

        // Restaura o link revezandoCom no jogador do time
        updatedTimes[timeIndex].jogadores = updatedTimes[timeIndex].jogadores.map((jg) => {
          if (jg.id_usuario === jogador.id_usuario) {
            return { ...jg, revezandoCom: reserva };
          }
          return jg;
        });
        break;
      }

      default:
        Alert.alert('Erro', 'Ação desconhecida para desfazer.');
        return;
    }

    setTimes(updatedTimes);
    setReservas(updatedReservas);
    setMoveHistory(moveHistory.slice(0, -1));

    Alert.alert('Desfeito', 'Última ação foi desfeita com sucesso.');
  };

  return { movePlayer, undoMove, moveHistory };
};

export default useTeamManagement;

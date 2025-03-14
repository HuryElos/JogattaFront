// jogos/utils/validarCampo.js

/**
 * Função para validar os campos do formulário de criação de jogo.
 *
 * Params:
 * - nomeJogo: Nome do jogo.
 * - limiteJogadores: Limite de jogadores.
 * - dataJogo: Data do jogo (Date object).
 * - horaInicio: Hora de início (Date object).
 * - horaFim: Hora de fim (Date object).
 *
 * Retorna:
 * - { isValid: boolean, message?: string }
 */
export const validarCampos = ({ nomeJogo, limiteJogadores, dataJogo, horaInicio, horaFim }) => {
    if (!nomeJogo.trim()) {
      return { isValid: false, message: 'O nome do jogo é obrigatório.' };
    }
  
    if (!limiteJogadores || parseInt(limiteJogadores, 10) <= 0) {
      return { isValid: false, message: 'O limite de jogadores deve ser maior que 0.' };
    }
  
    const dataHoraInicio = new Date(
      dataJogo.getFullYear(),
      dataJogo.getMonth(),
      dataJogo.getDate(),
      horaInicio.getHours(),
      horaInicio.getMinutes(),
      0,
      0
    );
  
    const dataHoraFim = new Date(
      dataJogo.getFullYear(),
      dataJogo.getMonth(),
      dataJogo.getDate(),
      horaFim.getHours(),
      horaFim.getMinutes(),
      0,
      0
    );
  
    if (dataHoraInicio <= new Date()) {
      return { isValid: false, message: 'A data/horário de início não pode ser no passado.' };
    }
  
    if (dataHoraFim <= dataHoraInicio) {
      return { isValid: false, message: 'A hora de fim deve ser posterior à hora de início.' };
    }
  
    return { isValid: true };
  };
  
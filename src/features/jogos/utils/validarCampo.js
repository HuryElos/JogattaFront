// src/features/jogos/utils/validarCampo.js

/**
 * Função para validar os campos do formulário de criação de jogo.
 *
 * Params:
 * - nomeJogo: string
 * - limiteJogadores: string ou number
 * - dataJogo: objeto Date (ou null)
 *
 * Retorna:
 * - { isValid: boolean, message?: string }
 */
export const validarCampos = ({ nomeJogo, limiteJogadores, dataJogo }) => {
  // 1) Nome do jogo
  if (!nomeJogo || !nomeJogo.trim()) {
    return { isValid: false, message: 'O nome do jogo é obrigatório.' };
  }

  // 2) Limite de jogadores > 0
  const lim = parseInt(limiteJogadores, 10);
  if (!lim || lim <= 0) {
    return { isValid: false, message: 'O limite de jogadores deve ser maior que 0.' };
  }

  // 3) Data do jogo não pode ser no passado (caso queira validar isso)
  if (!dataJogo) {
    return { isValid: false, message: 'A data do jogo é obrigatória.' };
  }
  // Se quiser impedir datas de hoje/pasado:
  if (dataJogo <= new Date()) {
    return { isValid: false, message: 'A data do jogo não pode ser no passado.' };
  }

  // Se chegou até aqui, está tudo ok
  return { isValid: true };
};

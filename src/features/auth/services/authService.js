// src/services/authService.js

import api from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

// Função para login
export const login = async (email, senha, userRole) => {
  console.log('Iniciando login com:', { email, senha, userRole });
  try {
    const endpoint = '/api/auth/login';

const response = await api.post(endpoint, { email, senha });
    console.log('Resposta do login:', response.data);
    return response.data; // Retorna {token, user, ...}
  } catch (error) {
    if (error.response) {
      console.error('Erro ao logar (resposta da API):', error.response.data);
    } else if (error.request) {
      console.error('Erro ao logar (sem resposta do servidor):', error.request);
    } else {
      console.error('Erro ao logar (configuração):', error.message);
    }
    throw new Error('Falha no login. Verifique suas credenciais.');
  }
};

// Função para registro (Jogador)
export const register = async (playerParams) => {
  try {
    const body = {
      nome: playerParams.name,
      email: playerParams.email,
      senha: playerParams.password,
      tt: playerParams.tt,
      altura: playerParams.altura,
      role: playerParams.role
    };
    
    const response = await api.post('/api/auth/register', body);
    console.log('Resposta do registro:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Erro ao registrar (resposta da API):', error.response.data);
      // Retorna a mensagem de erro específica da API se disponível
      throw new Error(error.response.data.error || 'Falha no registro. Tente novamente.');
    } else if (error.request) {
      console.error('Erro ao registrar (sem resposta do servidor):', error.request);
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    } else {
      console.error('Erro ao registrar (configuração):', error.message);
      throw new Error('Erro interno. Por favor, tente novamente.');
    }
  }
};

/**
 * Função para registro de Dono de Quadra (Gestor)
 * Chama o endpoint: /api/empresas/cadastro
 */
export const registerCourtOwner = async (params) => {
  try {
    const body = {
      nome: params.companyName,
      email_empresa: params.email,
      senha: params.password,
      cnpj: params.cnpj,
      contato: params.phone,
      endereco: params.address
    };
    const response = await api.post('/api/empresas/cadastro', body);
    console.log('Resposta do registro de Dono de Quadra:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Erro ao registrar dono de quadra (resposta da API):', error.response.data);
    } else if (error.request) {
      console.error('Erro ao registrar dono de quadra (sem resposta do servidor):', error.request);
    } else {
      console.error('Erro ao registrar dono de quadra (configuração):', error.message);
    }
    throw new Error('Falha no registro de Dono de Quadra. Tente novamente.');
  }
};

// Função para listar amigos
export const listarAmigos = async (organizador_id) => {
  try {
    console.log('Listar amigos com ID:', organizador_id);
    const response = await api.get(`/api/amigos/listar/${organizador_id}`);
    const amigos = response.data.map((amigo) => ({
      ...amigo,
      imagem_perfil: amigo.imagem_perfil || 'https://via.placeholder.com/50',
    }));
    console.log('Lista de amigos processada:', amigos);
    return amigos;
  } catch (error) {
    if (error.response) {
      console.error('Erro ao listar amigos (resposta da API):', error.response.data);
    } else if (error.request) {
      console.error('Erro ao listar amigos (sem resposta do servidor):', error.request);
    } else {
      console.error('Erro ao listar amigos (configuração):', error.message);
    }
    throw new Error('Falha ao buscar amigos. Tente novamente.');
  }
};

// Função para adicionar amigos
export const adicionarAmigos = async (organizador_id, amigoId) => {
  try {
    const response = await api.post('/api/amigos/adicionar', {
      organizador_id,
      amigo_id: amigoId,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar amigos:', error);
    throw new Error('Falha ao adicionar amigos. Tente novamente.');
  }
};

// Função para criar jogos
export const criarJogos = async (jogoData) => {
  try {
    const response = await api.post('/api/jogos/criar', jogoData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar jogos:', error);
    throw new Error('Falha ao criar jogo. Tente novamente.');
  }
};

// Função para editar perfil (atualizar imagem de perfil)
export const editarProfile = async (imageUri) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Token não encontrado. Faça login novamente.');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    const response = await api.put(`/api/jogador/imagem_perfil`, {
      id_usuario: userId,
      imagem_perfil: imageUri,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Resposta ao editar perfil:', response.data);
    return response.data.usuario;
  } catch (error) {
    console.error('Erro ao editar perfil:', error);
    throw new Error('Falha ao editar perfil. Tente novamente.');
  }
};

// Nova Função: Atualizar Descrição do Perfil
export const atualizarDescricao = async (descricao) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Token não encontrado. Faça login novamente.');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    const response = await api.put(`/api/jogador/descricao`, {
      id_usuario: userId,
      descricao: descricao,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Resposta ao atualizar descrição:', response.data);
    return response.data.usuario;
  } catch (error) {
    console.error('Erro ao atualizar descrição:', error);
    throw new Error('Falha ao atualizar descrição. Tente novamente.');
  }
};

// Função para equilibrar times
export const equilibrarTimes = async (jogoId) => {
  try {
    console.log('=== Iniciando equilíbrio de times para o jogo ===');
    const response = await api.get(`/api/jogos/${jogoId}/equilibrar-times`);
    console.log('Dados recebidos da API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao equilibrar times:', error);
    throw new Error('Falha ao equilibrar times. Tente novamente.');
  }
};

// Função para buscar habilidades dos amigos
export const buscarHabilidadesAmigos = async (jogoId) => {
  try {
    const response = await api.get(`/api/jogos/${jogoId}/habilidades`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar habilidades:', error);
    throw new Error('Falha ao buscar habilidades. Tente novamente.');
  }
};

// Função para salvar habilidades
export const salvarHabilidades = async (jogoId, habilidades) => {
  try {
    const response = await api.post(`/api/jogos/${jogoId}/habilidades`, {
      habilidades: habilidades,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao salvar habilidades:', error);
    throw new Error('Falha ao salvar habilidades. Tente novamente.');
  }
};

// Função para buscar perfil do jogador
export const buscarPerfilJogador = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    const response = await api.get('/api/jogador/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Perfil do jogador:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar perfil do jogador:', error);
    throw new Error('Falha ao buscar perfil. Tente novamente.');
  }
};

// Função para acessar rota protegida
export const acessarRotaProtegida = async () => {
  try {
    const response = await api.get('/api/auth/protected');
    return response.data;
  } catch (error) {
    console.error('Erro ao acessar rota protegida:', error);
    throw new Error('Falha ao acessar rota protegida. Tente novamente.');
  }
};

// Função para buscar avaliações
export const buscarAvaliacoes = async (organizador_id) => {
  try {
    const response = await api.get(`/api/avaliacoes/organizador/${organizador_id}`);
    console.log('Jogadores e avaliações recuperados:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    throw new Error('Falha ao buscar avaliações. Tente novamente.');
  }
};

// Função para salvar avaliações e equilibrar times
export const salvarAvaliacoes = async (organizador_id, habilidadesModal, jogoId, tamanhoTime) => {
  try {
    await api.post('/avaliacoes/salvar', {
      organizador_id: organizador_id,
      usuario_id: habilidadesModal.id,
      passe: habilidadesModal.passe,
      ataque: habilidadesModal.ataque,
      levantamento: habilidadesModal.levantamento,
    });

    const response = await api.post('/api/jogador/equilibrar-times', {
      organizador_id: organizador_id,
      jogo_id: jogoId,
      tamanho_time: tamanhoTime,
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao salvar avaliações ou equilibrar times:', error);
    throw new Error('Falha ao salvar avaliações ou equilibrar times. Tente novamente.');
  }
};

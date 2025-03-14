// src/services/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/config'; // Ajuste o caminho conforme a estrutura do seu projeto

// Cria uma instância do Axios com a URL base definida
const api = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: 60000, // Tempo máximo de espera (em milissegundos)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador de requisição para adicionar o token de autenticação automaticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao obter token do AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta para tratar erros globalmente (opcional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token inválido ou expirado
      // Você pode implementar uma lógica para redirecionar para a tela de login
      console.warn('Token expirado ou inválido. Faça login novamente.');
      // Exemplo: Navegar para a tela de login ou despachar uma ação de logout
    }
    return Promise.reject(error);
  }
);

export default api;

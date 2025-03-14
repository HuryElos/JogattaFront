import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { login, buscarPerfilJogador } from '../features/auth/services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('Token encontrado no AsyncStorage:', token);

        if (token && typeof token === 'string') {
          const decodedToken = jwtDecode(token);
          console.log('Token decodificado:', decodedToken);

          if (decodedToken.exp * 1000 > Date.now()) {
            const userData = await buscarPerfilJogador();
            setUser({
              id: userData.id_usuario,
              role: userData.papel_usuario,
              nome: userData.nome,
              email: userData.email,
              profile_image: userData.imagem_perfil || null,
              tt: userData.tt,
              descricao: userData.descricao || '', // Adicionando a descrição
            });
          } else {
            console.warn('Token expirado. Removendo...');
            await AsyncStorage.removeItem('token');
          }
        } else {
          console.error('Erro: Token inválido ou não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao verificar o token no AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await login(email, password);

      if (response && response.token && response.user) {
        await AsyncStorage.setItem('token', response.token);

        setUser({
          id: response.user.id_usuario,
          role: response.user.papel_usuario,
          nome: response.user.nome,
          email: response.user.email,
          profile_image: response.user.imagem_perfil || null,
          tt: response.user.tt,
          descricao: response.user.descricao || '', // Corrigido para usar response.user
        });

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erro ao realizar login:', error.message || error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login: handleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

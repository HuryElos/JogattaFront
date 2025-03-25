import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { login, buscarPerfilJogador } from '../features/auth/services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para mapear os papéis do backend para o frontend
  const mapUserRole = (backendRole) => {
    switch (backendRole) {
      case 'gestor':
      case 'owner':
      case 'dono_quadra':
        return 'courtOwner';
      case 'jogador':
        return 'player';
      default:
        return backendRole;
    }
  };

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
            
            // Mapeie o papel do usuário
            const mappedRole = mapUserRole(userData.papel_usuario);
            
            // Salve o papel mapeado no AsyncStorage para uso na navegação
            await AsyncStorage.setItem('userRole', mappedRole);
            
            setUser({
              id: userData.id_usuario,
              role: userData.papel_usuario, // Papel original do banco
              mappedRole: mappedRole, // Papel mapeado para o frontend
              nome: userData.nome,
              email: userData.email,
              profile_image: userData.imagem_perfil || null,
              tt: userData.tt,
              descricao: userData.descricao || '',
            });
          } else {
            console.warn('Token expirado. Removendo...');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('userRole');
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

  const handleLogin = async (email, password, userRole) => {
    try {
      const response = await login(email, password, userRole);

      if (response && response.token && response.user) {
        // Salvar o token
        await AsyncStorage.setItem('token', response.token);
        
        // Mapear o papel do usuário
        const mappedRole = mapUserRole(response.user.papel_usuario);
        
        // Salvar o papel mapeado
        await AsyncStorage.setItem('userRole', mappedRole);
        
        // Salvar os dados do usuário como string JSON
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
        
        // Atualizar o estado do usuário
        setUser({
          id: response.user.id_usuario,
          role: response.user.papel_usuario,
          mappedRole: mappedRole,
          nome: response.user.nome,
          email: response.user.email,
          profile_image: response.user.imagem_perfil || null,
          tt: response.user.tt,
          descricao: response.user.descricao || '',
        });
        
        console.log('Login bem-sucedido:', {
          role: response.user.papel_usuario,
          mappedRole: mappedRole
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
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('user_data');
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
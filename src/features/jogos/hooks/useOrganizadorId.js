import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../services/api';
import jwtDecode from 'jwt-decode';

/**
 * Hook para obter o ID do organizador a partir do token JWT.
 *
 * Retorna:
 * - organizador_id: ID do organizador.
 * - loading: Booleano indicando o estado de carregamento.
 * - error: Erro ocorrido durante a obtenção do ID.
 */
const useOrganizadorId = () => {
  const [organizador_id, setOrganizadorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrganizadorId = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Usuário não autenticado.');

        const decoded = jwtDecode(token);
        const userId = decoded.userId || decoded.id;
        setOrganizadorId(userId);
      } catch (err) {
        console.error('Erro ao buscar o organizador:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizadorId();
  }, []);

  return { organizador_id, loading, error };
};

export default useOrganizadorId;

import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import api from '../../../services/api';

/**
 * Hook para buscar os jogadores com avaliações.
 * @param {number} organizador_id
 * @param {Array} amigosSelecionados
 * @param {string} fluxo (ex: 'offline' ou 'online')
 */
const useFetchJogadores = (organizador_id, amigosSelecionados = [], fluxo = 'offline') => {
  const [jogadores, setJogadores] = useState([]);
  const [loading, setLoading] = useState(false);

  const prevJogadoresRef = useRef([]);

  useEffect(() => {
    const fetchJogadores = async () => {
      try {
        setLoading(true);
        console.log('Buscando avaliações para organizador:', organizador_id);

        const responseAvaliacoes = await api.get(
          `/api/avaliacoes/organizador/${organizador_id}`
        );
        console.log('Avaliações recebidas:', responseAvaliacoes.data);

        const jogadoresComAvaliacoes = (amigosSelecionados || []).map((amigo) => {
          const avaliacao = responseAvaliacoes.data.find(
            (av) => av.usuario_id === amigo.id_usuario
          );
          return {
            ...amigo,
            id: amigo.id_usuario || amigo.id,
            passe: avaliacao?.passe || 0,
            ataque: avaliacao?.ataque || 0,
            levantamento: avaliacao?.levantamento || 0,
          };
        });

        console.log('Jogadores combinados:', jogadoresComAvaliacoes);

        // Função para comparar arrays
        const isSameArray = (arr1, arr2) => {
          if (arr1.length !== arr2.length) return false;
          for (let i = 0; i < arr1.length; i++) {
            const jogador1 = arr1[i];
            const jogador2 = arr2[i];
            if (
              jogador1.id !== jogador2.id ||
              jogador1.passe !== jogador2.passe ||
              jogador1.ataque !== jogador2.ataque ||
              jogador1.levantamento !== jogador2.levantamento
            ) {
              return false;
            }
          }
          return true;
        };

        if (!isSameArray(prevJogadoresRef.current, jogadoresComAvaliacoes)) {
          console.log('Atualizando jogadores no estado.');
          setJogadores(jogadoresComAvaliacoes);
          prevJogadoresRef.current = jogadoresComAvaliacoes;
        } else {
          console.log('Jogadores já estão atualizados.');
        }
      } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        Alert.alert('Erro', 'Não foi possível carregar os jogadores.');
      } finally {
        setLoading(false);
      }
    };

    if (organizador_id && amigosSelecionados.length > 0) {
      console.log('Iniciando fetchJogadores...');
      fetchJogadores();
    } else {
      console.log('Sem organizador_id ou amigos selecionados.');
      setJogadores([]);
      prevJogadoresRef.current = [];
    }
  }, [organizador_id, amigosSelecionados.length]);

  return { jogadores, setJogadores, loading };
};

export default useFetchJogadores;

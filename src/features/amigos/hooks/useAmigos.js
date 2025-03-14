import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import api from '../../../services/api';

console.log('API importada no useAmigos.js:', api);

/**
 * Função para gerar um ID único dentro do intervalo de 32-bit integer.
 */
const gerarIdUnico = async (amigosValidos, temporarios) => {
  const MAX_INT = 2147483647;
  let idGerado;
  let tentativa = 0;
  const MAX_TENTATIVAS = 1000;

  do {
    idGerado = Math.floor(Math.random() * MAX_INT) + 1;
    tentativa += 1;
    if (tentativa > MAX_TENTATIVAS) {
      throw new Error('Não foi possível gerar um ID único para o jogador temporário.');
    }
  } while (
    amigosValidos.some((amigo) => amigo.id_usuario === idGerado) ||
    temporarios.some((amigo) => amigo.id === idGerado)
  );

  return idGerado;
};

const useAmigos = (navigation) => {
  const [amigos, setAmigos] = useState([]);
  const [amigosAll, setAmigosAll] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregarAmigosTemporarios = useCallback(async () => {
    try {
      const storageData = await AsyncStorage.getItem('amigosTemporarios');
      const temporarios = JSON.parse(storageData) || [];
      console.log('Amigos temporários carregados:', temporarios);
      return temporarios;
    } catch (error) {
      console.error('Erro ao carregar amigos temporários:', error);
      return [];
    }
  }, []);

  const salvarAmigoTemporario = useCallback(
    async (novoAmigo) => {
      try {
        const amigosTemporarios = await carregarAmigosTemporarios();
        amigosTemporarios.push(novoAmigo);
        await AsyncStorage.setItem('amigosTemporarios', JSON.stringify(amigosTemporarios));
        console.log('Novo amigo temporário salvo:', novoAmigo);
      } catch (error) {
        console.error('Erro ao salvar amigo temporário:', error);
        throw new Error('Erro ao salvar amigo temporário');
      }
    },
    [carregarAmigosTemporarios]
  );

  const carregarDadosIniciais = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado.');
      }
      const { id } = jwtDecode(token);
      console.log('Usuário logado com ID:', id);

      // Carregar amigos "oficiais" da API
      const amigosResp = await api.get(`/api/amigos/listar/${id}`, {
        params: { page: 1, limit: 9999, searchTerm: '' },
      });
      const amigosValidos = Array.isArray(amigosResp.data.data) ? amigosResp.data.data : [];
      console.log('Amigos carregados da API:', amigosValidos);

      // Carregar temporários (OFFLINE)
      const temporarios = await carregarAmigosTemporarios();
      const allAmigos = [...temporarios, ...amigosValidos];
      console.log('Lista completa de amigos (temporários + válidos):', allAmigos);

      setAmigosAll(allAmigos);
      setAmigos(allAmigos);

      // Carregar grupos
      const gruposResp = await api.get(`/api/groups/listar/${id}`);
      const gruposCarregados = Array.isArray(gruposResp.data) ? gruposResp.data : [];
      console.log('Grupos carregados:', gruposCarregados);
      setGrupos(gruposCarregados);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      Alert.alert('Erro', error.message || 'Falha ao carregar dados. Tente novamente.');
      if (error.message === 'Usuário não autenticado.') {
        navigation.navigate('Login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [carregarAmigosTemporarios, navigation]);

  const filtrarAmigos = useCallback(
    (termoBusca) => {
      const term = termoBusca.toLowerCase();
      const filtrados = amigosAll.filter((a) => a.nome.toLowerCase().includes(term));
      setAmigos(filtrados);
      console.log(`Amigos filtrados com o termo "${termoBusca}":`, filtrados);
    },
    [amigosAll]
  );

  // Cria jogador temporário OFFLINE
  const criarAmigoTemporarioOffline = useCallback(
    async (nome) => {
      if (!nome.trim()) throw new Error('O nome do jogador é obrigatório.');
      const amigosOficiais = amigosAll.filter((a) => !a.temporario);
      const temporariosOffline = await carregarAmigosTemporarios();
      const idGerado = await gerarIdUnico(amigosOficiais, temporariosOffline);
      const novoAmigo = {
        id: idGerado,
        nome: nome.trim(),
        email: null,
        imagem_perfil: null,
        temporario: true,
      };
      await salvarAmigoTemporario(novoAmigo);
      setAmigosAll((prev) => [novoAmigo, ...prev]);
      setAmigos((prev) => [novoAmigo, ...prev]);
      console.log('Jogador temporário criado (Offline):', novoAmigo);
    },
    [amigosAll, carregarAmigosTemporarios, salvarAmigoTemporario]
  );

  // Cria jogador temporário ONLINE
  const criarAmigoTemporarioOnline = useCallback(async (nome) => {
    if (!nome.trim()) throw new Error('O nome do jogador é obrigatório.');
    try {
      const user = await api.get('/api/usuario/me');
      const organizador_id = user.data.id_usuario;
      const response = await api.post('/api/temporarios/criar', {
        organizador_id,
        nome: nome.trim(),
      });
      const novoTemp = response.data.jogador;
      console.log('Jogador temporário criado (Online):', novoTemp);
      setAmigosAll((prev) => [...prev, { ...novoTemp, temporario: true }]);
      setAmigos((prev) => [...prev, { ...novoTemp, temporario: true }]);
    } catch (error) {
      console.error('Erro ao criar amigo temporário online:', error.response?.data || error.message);
      throw new Error('Não foi possível criar o jogador temporário online.');
    }
  }, []);

  // Decide criar OFFLINE ou ONLINE
  const criarAmigoTemporario = useCallback(
    async (nome, fluxo = 'offline') => {
      if (fluxo === 'online') {
        await criarAmigoTemporarioOnline(nome);
      } else {
        await criarAmigoTemporarioOffline(nome);
      }
    },
    [criarAmigoTemporarioOffline, criarAmigoTemporarioOnline]
  );

  // Criação de grupo com associação imediata dos membros selecionados
  const criarGrupo = useCallback(
    async (nomeGrupo, membros) => {
      if (!nomeGrupo.trim()) {
        throw new Error('O nome do grupo não pode estar vazio.');
      }
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
          navigation.navigate('Login');
          return;
        }
        const { id } = jwtDecode(token);

        const response = await api.post('/api/groups/criar', {
          organizador_id: id,
          nome_grupo: nomeGrupo,
          membros, // Envia os IDs dos membros selecionados
        });

        if (response.status === 201) {
          let grupoCriado;
          // Se a API retornar um grupo com membros não vazios, usa-o;
          // senão, forçamos a inclusão dos membros a partir dos IDs selecionados.
          if (
            response.data.group &&
            Array.isArray(response.data.group.membros) &&
            response.data.group.membros.length > 0
          ) {
            grupoCriado = response.data.group;
          } else {
            grupoCriado = {
              id_grupo: response.data.group ? response.data.group.id_grupo : response.data.id,
              nome_grupo: nomeGrupo,
              membros: membros.map((membroId) => {
                const amigo = amigosAll.find(
                  (a) => (a.id_usuario ? a.id_usuario === membroId : a.id === membroId)
                );
                return amigo || { id: membroId, nome: 'Desconhecido' };
              }),
            };
          }
          setGrupos((prev) => [grupoCriado, ...prev]);
          Alert.alert('Sucesso', `Grupo "${nomeGrupo}" criado com sucesso!`);
        } else {
          Alert.alert('Erro', 'Não foi possível criar o grupo.');
        }
      } catch (error) {
        console.error('Erro ao criar grupo:', error);
        Alert.alert('Erro', 'Erro ao conectar-se ao servidor.');
      }
    },
    [amigosAll, navigation]
  );

  return {
    amigos,
    amigosAll,
    grupos,
    isLoading,
    carregarDadosIniciais,
    filtrarAmigos,
    criarAmigoTemporario,
    criarGrupo,
    setAmigos,
    setAmigosAll,
  };
};

export default useAmigos;

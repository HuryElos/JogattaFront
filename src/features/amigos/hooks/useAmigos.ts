import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../../../services/api';
import type { Amigo, Grupo } from '../types';

// -------------------------------
// TIPOS
// -------------------------------
interface DecodedToken {
  id: number;
  exp: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface AmigosResponse {
  data: Amigo[];
}

interface TemporarioResponse {
  jogador: Amigo;
}

interface GrupoResponse {
  group: Grupo;
}

type RootStackParamList = {
  Login: undefined;
};

type UseAmigosNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface UseAmigosReturn {
  amigos: Amigo[];
  amigosAll: Amigo[];
  grupos: Grupo[];
  isLoading: boolean;
  carregarDadosIniciais: () => Promise<void>;
  filtrarAmigos: (termoBusca: string) => void;
  criarAmigoTemporario: (nome: string, fluxo?: 'online' | 'offline') => Promise<void>;
  criarGrupo: (nomeGrupo: string, membros: number[]) => Promise<void>;
}

// -------------------------------
// FUNÇÕES AUXILIARES
// -------------------------------
const gerarIdUnico = async (amigosValidos: Amigo[], temporarios: Amigo[]): Promise<number> => {
  const MAX_INT = 2147483647;
  let idGerado: number;
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

// -------------------------------
// HOOK PRINCIPAL
// -------------------------------
const useAmigos = (navigation: UseAmigosNavigationProp): UseAmigosReturn => {
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [amigosAll, setAmigosAll] = useState<Amigo[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // -------------------------------
  // FUNÇÕES DE AMIGOS TEMPORÁRIOS
  // -------------------------------
  const carregarAmigosTemporarios = useCallback(async (): Promise<Amigo[]> => {
    try {
      const storageData = await AsyncStorage.getItem('amigosTemporarios');
      const temporarios = JSON.parse(storageData || '[]') as Amigo[];
      console.log('Amigos temporários carregados:', temporarios);
      return temporarios;
    } catch (error) {
      console.error('Erro ao carregar amigos temporários:', error);
      return [];
    }
  }, []);

  const salvarAmigoTemporario = useCallback(
    async (novoAmigo: Amigo): Promise<void> => {
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

  // -------------------------------
  // FUNÇÕES PRINCIPAIS
  // -------------------------------
  const carregarDadosIniciais = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Usuário não autenticado.');
      }
      const { id } = jwtDecode<DecodedToken>(token);
      console.log('Usuário logado com ID:', id);

      const amigosResp = await api.get<AmigosResponse>(`/api/amigos/listar/${id}`, {
        params: { page: 1, limit: 9999, searchTerm: '' },
      });
      const amigosValidos = Array.isArray(amigosResp.data.data) ? amigosResp.data.data : [];
      console.log('Amigos carregados da API:', amigosValidos);

      const temporarios = await carregarAmigosTemporarios();
      const allAmigos = [...temporarios, ...amigosValidos];
      console.log('Lista completa de amigos (temporários + válidos):', allAmigos);

      setAmigosAll(allAmigos);
      setAmigos(allAmigos);

      const gruposResp = await api.get<Grupo[]>(`/api/groups/listar/${id}`);
      const gruposCarregados = Array.isArray(gruposResp.data) ? gruposResp.data : [];
      console.log('Grupos carregados:', gruposCarregados);
      setGrupos(gruposCarregados);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao carregar dados. Tente novamente.';
      Alert.alert('Erro', errorMessage);
      if (error instanceof Error && error.message === 'Usuário não autenticado.') {
        navigation.navigate('Login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [carregarAmigosTemporarios, navigation]);

  const filtrarAmigos = useCallback(
    (termoBusca: string): void => {
      const term = termoBusca.toLowerCase();
      const filtrados = amigosAll.filter((a) => a.nome.toLowerCase().includes(term));
      setAmigos(filtrados);
      console.log(`Amigos filtrados com o termo "${termoBusca}":`, filtrados);
    },
    [amigosAll]
  );

  const criarAmigoTemporarioOffline = useCallback(
    async (nome: string): Promise<void> => {
      if (!nome.trim()) throw new Error('O nome do jogador é obrigatório.');
      const amigosOficiais = amigosAll.filter((a) => !a.temporario);
      const temporariosOffline = await carregarAmigosTemporarios();
      const idGerado = await gerarIdUnico(amigosOficiais, temporariosOffline);
      const novoAmigo: Amigo = {
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

  const criarAmigoTemporarioOnline = useCallback(async (nome: string): Promise<void> => {
    if (!nome.trim()) throw new Error('O nome do jogador é obrigatório.');
    try {
      const user = await api.get<{ id_usuario: number }>('/api/usuario/me');
      const organizador_id = user.data.id_usuario;
      const response = await api.post<TemporarioResponse>('/api/temporarios/criar', {
        organizador_id,
        nome: nome.trim(),
      });
      const novoTemp = response.data.jogador;
      console.log('Jogador temporário criado (Online):', novoTemp);
      setAmigosAll((prev) => [...prev, { ...novoTemp, temporario: true }]);
      setAmigos((prev) => [...prev, { ...novoTemp, temporario: true }]);
    } catch (error) {
      console.error('Erro ao criar amigo temporário online:', error);
      throw new Error('Não foi possível criar o jogador temporário online.');
    }
  }, []);

  const criarAmigoTemporario = useCallback(
    async (nome: string, fluxo: 'online' | 'offline' = 'offline'): Promise<void> => {
      if (fluxo === 'online') {
        await criarAmigoTemporarioOnline(nome);
      } else {
        await criarAmigoTemporarioOffline(nome);
      }
    },
    [criarAmigoTemporarioOffline, criarAmigoTemporarioOnline]
  );

  const criarGrupo = useCallback(
    async (nomeGrupo: string, membros: number[]): Promise<void> => {
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
        const { id } = jwtDecode<DecodedToken>(token);

        const response = await api.post<GrupoResponse>('/api/groups/criar', {
          organizador_id: id,
          nome_grupo: nomeGrupo,
          membros,
        });

        if (response.status === 201) {
          let grupoCriado: Grupo;
          if (
            response.data.group &&
            Array.isArray(response.data.group.membros) &&
            response.data.group.membros.length > 0
          ) {
            grupoCriado = response.data.group;
          } else {
            const membrosGrupo = amigosAll.filter((a) => membros.includes(a.id_usuario || a.id));
            grupoCriado = {
              ...response.data.group,
              membros: membrosGrupo,
            };
          }
          setGrupos((prev) => [grupoCriado, ...prev]);
          console.log('Grupo criado com sucesso:', grupoCriado);
        }
      } catch (error) {
        console.error('Erro ao criar grupo:', error);
        throw new Error('Não foi possível criar o grupo.');
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
  };
};

export default useAmigos; 
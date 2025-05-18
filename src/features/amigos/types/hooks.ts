import { RootStackParamList } from './navigation';
import { Amigo, Grupo } from './amigos';

type NavigateFunction = {
  (name: 'JogosFlow', params: { screen: string; params: { amigosSelecionados: Amigo[]; fluxo: string } }): void;
  (name: 'Login'): void;
  (name: 'ConvidarAmigos', params: { fluxo?: string }): void;
};

export interface UseAmigosProps {
  navigate: NavigateFunction;
}

export interface UseAmigosReturn {
  amigos: Amigo[];
  amigosAll: Amigo[];
  grupos: Grupo[];
  isLoading: boolean;
  carregarDadosIniciais: () => Promise<void>;
  filtrarAmigos: (termo: string) => void;
  criarAmigoTemporario: (nome: string, fluxo: 'offline' | 'online') => Promise<void>;
  criarGrupo: (nome: string, membros: number[]) => Promise<void>;
} 
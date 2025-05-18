export interface Amigo {
  id: number;
  id_usuario?: number;
  nome: string;
  email?: string | null;
  imagem_perfil?: string | null;
  temporario?: boolean;
}

export interface Grupo {
  id: number;
  nome: string;
  organizador_id: number;
  membros: Amigo[];
}

export interface Selecionado {
  tipo: 'amigo' | 'grupo';
  id: number;
} 
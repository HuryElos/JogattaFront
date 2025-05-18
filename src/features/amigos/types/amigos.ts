export interface Amigo {
  id: number;
  id_usuario?: number;
  nome: string;
  temporario?: boolean;
}

export type TempAmigo = Omit<Amigo, 'id'> & {
  id_usuario: number;
};

export interface Grupo {
  id: number;
  id_grupo: number;
  nome_grupo: string;
  membros: Amigo[];
}

export type Selecao = {
  tipo: 'amigo' | 'grupo';
  id: number;
}; 
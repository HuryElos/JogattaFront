import { Empresa, Quadra } from '../types';

// Tipos de ação
export type SelecaoAction =
  | { type: 'SET_EMPRESA'; payload: Empresa | null }
  | { type: 'SET_QUADRA'; payload: Quadra | null }
  | { type: 'SET_HORARIO_INICIO'; payload: string | null }
  | { type: 'SET_HORARIO_FIM'; payload: string | null }
  | { type: 'SET_DATA'; payload: Date }
  | { type: 'RESET' };

// Interface do estado
export interface SelecaoState {
  empresa: Empresa | null;
  quadra: Quadra | null;
  horarioInicio: string | null;
  horarioFim: string | null;
  data: Date;
}

// Estado inicial
export const initialState: SelecaoState = {
  empresa: null,
  quadra: null,
  horarioInicio: null,
  horarioFim: null,
  data: new Date(),
};

// Reducer
export function selecaoReducer(state: SelecaoState, action: SelecaoAction): SelecaoState {
  console.log('Reducer Action:', action.type, action.payload); // Log para debug
  
  switch (action.type) {
    case 'SET_EMPRESA':
      return {
        ...state,
        empresa: action.payload,
        quadra: null, // Reseta quadra ao mudar empresa
        horarioInicio: null, // Reseta horários
        horarioFim: null,
      };
    
    case 'SET_QUADRA':
      return {
        ...state,
        quadra: action.payload,
        horarioInicio: null, // Reseta horários ao mudar quadra
        horarioFim: null,
      };
    
    case 'SET_HORARIO_INICIO':
      return {
        ...state,
        horarioInicio: action.payload,
        horarioFim: null, // Reseta horário fim ao mudar início
      };
    
    case 'SET_HORARIO_FIM':
      return {
        ...state,
        horarioFim: action.payload,
      };
    
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        horarioInicio: null, // Reseta horários ao mudar data
        horarioFim: null,
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
} 
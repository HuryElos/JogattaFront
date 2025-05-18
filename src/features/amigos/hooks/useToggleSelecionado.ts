import { useState, useCallback } from 'react';
import type { Selecionado } from '../types';

interface UseToggleSelecionadoReturn {
  selecionados: Selecionado[];
  toggleSelecionado: (tipo: Selecionado['tipo'], id: number) => void;
  setSelecionados: React.Dispatch<React.SetStateAction<Selecionado[]>>;
}

const useToggleSelecionado = (): UseToggleSelecionadoReturn => {
  const [selecionados, setSelecionados] = useState<Selecionado[]>([]);

  const toggleSelecionado = useCallback((tipo: Selecionado['tipo'], id: number): void => {
    if (id == null) {
      console.warn('ID inválido:', id);
      return;
    }
    setSelecionados(prev => {
      const existe = prev.find(x => x.tipo === tipo && x.id === id);
      return existe
        ? prev.filter(x => !(x.tipo === tipo && x.id === id))
        : [...prev, { tipo, id }];
    });
  }, []);

  return {
    selecionados,
    toggleSelecionado,
    setSelecionados,
  };
};

export default useToggleSelecionado; 
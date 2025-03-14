// src/features/amigos/hooks/useToggleSelecionado.js

// Descrição:
// Este hook gerencia a seleção de amigos e grupos em um estado compartilhado.
// Permite alternar a seleção de itens com base no tipo (`amigo` ou `grupo`) e no ID.

// Relacionamentos:
// - Usado na tela `ConvidarAmigos`.
// - Auxilia na manipulação do estado de itens selecionados em listas exibidas por `AmigosList` e `GrupoList`.

import { useState, useCallback } from 'react';

const useToggleSelecionado = () => {
  const [selecionados, setSelecionados] = useState([]);

  const toggleSelecionado = useCallback((tipo, id) => {
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

  return { selecionados, toggleSelecionado, setSelecionados };
};

export default useToggleSelecionado;

import React, { createContext, useState, useEffect } from 'react';
import { Text, View } from 'react-native';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('[CompanyContext] Iniciando Provider');

  useEffect(() => {
    // Simula carregamento de dados
    console.log('[CompanyContext] Simulando busca de empresa...');

    const timeout = setTimeout(() => {
      setCompany({ nome: 'Empresa Exemplo' }); // ou null pra testar erro
      setIsLoading(false);
      console.log('[CompanyContext] Empresa carregada');
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) {
    console.log('[CompanyContext] Carregando empresa...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Carregando empresa...</Text>
      </View>
    );
  }

  console.log('[CompanyContext] Renderizando children com empresa:', company);

  return (
    <CompanyContext.Provider value={{ company, setCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyContext;

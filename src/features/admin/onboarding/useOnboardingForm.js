import React, { createContext, useContext, useState } from 'react';

// Criação do contexto
const OnboardingFormContext = createContext();

// Provider que envolve as telas do onboarding
export function OnboardingFormProvider({ children }) {
  const [formData, setFormData] = useState({});

  // Atualiza os dados parciais
  const updateForm = (newData) => {
    setFormData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
    <OnboardingFormContext.Provider value={{ formData, updateForm }}>
      {children}
    </OnboardingFormContext.Provider>
  );
}

// Hook para acessar o contexto
export function useOnboardingForm() {
  const context = useContext(OnboardingFormContext);
  if (!context) {
    throw new Error('useOnboardingForm must be used within an OnboardingFormProvider');
  }
  return context;
}

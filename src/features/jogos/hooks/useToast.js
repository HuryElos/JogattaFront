import { useState, useRef } from 'react';

const useToast = () => {
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const timeoutRef = useRef(null); // Referência para o timeout ativo

  const triggerToast = (message) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); // Limpa timeout anterior
    }

    setToastMessage(message);
    setShowToast(true);

    // Fecha o Toast automaticamente após 2.5s
    timeoutRef.current = setTimeout(() => {
      setShowToast(false);
      timeoutRef.current = null; // Reseta a referência
    }, 2500);
  };

  return { toastMessage, showToast, triggerToast };
};

export default useToast;

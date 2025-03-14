// jogos/hooks/useDateTime.js

import { useState } from 'react';

/**
 * Hook personalizado para lidar com Data e Hora.
 *
 * Retorna:
 * - data: Data selecionada.
 * - horaInicio: Hora de início selecionada.
 * - horaFim: Hora de fim selecionada.
 * - showDatePicker: Booleano para exibir o DatePicker.
 * - showTimePicker: String indicando qual TimePicker mostrar ('inicio' | 'fim' | null).
 * - setShowDatePicker: Função para alterar o estado de showDatePicker.
 * - setShowTimePicker: Função para alterar o estado de showTimePicker.
 * - handleDateChange: Função para lidar com a mudança da data.
 * - handleTimeChange: Função para lidar com a mudança da hora.
 */
const useDateTime = () => {
  const [data, setData] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState(new Date());
  const [horaFim, setHoraFim] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(null); // 'inicio' | 'fim' | null

  const handleDateChange = ({ date }) => {
    setShowDatePicker(false);
    if (date) setData(date);
  };

  const handleTimeChange = ({ hours, minutes }) => {
    setShowTimePicker(null);
    const selectedTime = new Date();
    selectedTime.setHours(hours);
    selectedTime.setMinutes(minutes);

    if (showTimePicker === 'inicio') {
      setHoraInicio(selectedTime);
    } else if (showTimePicker === 'fim') {
      setHoraFim(selectedTime);
    }
  };

  return {
    data,
    horaInicio,
    horaFim,
    showDatePicker,
    showTimePicker,
    setShowDatePicker,
    setShowTimePicker,
    handleDateChange,
    handleTimeChange,
  };
};

export default useDateTime;

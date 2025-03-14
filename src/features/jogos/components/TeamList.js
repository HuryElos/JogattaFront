// src/features/jogo/components/TeamList.js

import React, { useState } from 'react';
import { ScrollView, Button } from 'react-native';
import TeamCard from './TeamCard';
import usePDFExport from '../hooks/usePDFExport';

const TeamList = () => {
  const [times, setTimes] = useState([
    {
      id: 1,
      nomeTime: 'Time A',
      jogadores: [
        { id: 1, nome: 'Jogador 1', passe: 3, ataque: 4, levantamento: 5, isLevantador: false, foto: null },
        // Outros jogadores...
      ],
    },
    // Outros times...
  ]);

  const { gerarPDF } = usePDFExport();

  const updatePlayerLevantador = (playerId, newStatus) => {
    const updatedTimes = times.map((time) => ({
      ...time,
      jogadores: time.jogadores.map((jogador) =>
        jogador.id === playerId ? { ...jogador, isLevantador: newStatus } : jogador
      ),
    }));
    setTimes(updatedTimes);
  };

  const handleGeneratePDF = () => {
    // Supondo que você tenha reservas e exibirBarras definidos
    const reservas = []; // Defina suas reservas
    const exibirBarras = true; // Ou false, conforme necessário
    gerarPDF(times, reservas, exibirBarras);
  };

  return (
    <ScrollView>
      {times.map((time, index) => (
        <TeamCard
          key={`time-${time.id}`}
          time={time}
          index={index}
          onMovePress={(jogador, indexTime) => { /* Lógica para mover jogador */ }}
          onPlayerPress={(jogador) => { /* Lógica se necessário */ }}
          onEditName={(indexTime) => { /* Lógica para editar nome do time */ }}
          isEditing={false} // Atualize conforme necessário
          tempTeamName="" // Atualize conforme necessário
          setTempTeamName={() => { /* Lógica para atualizar nome temporário */ }}
          saveTeamName={(indexTime) => { /* Lógica para salvar nome do time */ }}
          onOpenTeamLevel={(indexTime) => { /* Lógica para abrir nível do time */ }}
          updatePlayerLevantador={updatePlayerLevantador}
        />
      ))}
      <Button title="Gerar PDF" onPress={handleGeneratePDF} />
    </ScrollView>
  );
};

export default TeamList;

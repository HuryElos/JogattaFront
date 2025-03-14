// src/features/jogo/components/TeamCard.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalJogadorDetalhes from './ModalJogadorDetalhes'; // Importando o Modal
import styles from '../styles/TimesBalanceados.styles'; // Importando os estilos

const TeamCard = ({
  time,
  index,
  onMovePress,
  onPlayerPress,
  onEditName,
  isEditing,
  tempTeamName,
  setTempTeamName,
  saveTeamName,
  onOpenTeamLevel,
  updatePlayerLevantador, // Função para atualizar o status de levantador
  onRevezarPress,         // Função para revezar jogadores
  onDesvincularPress,     // Função para desvincular jogadores (nova prop)
}) => {
  const colorArray = ['#FF9800', '#2196F3', '#32CD32', '#FF69B4', '#8A2BE2'];
  const borderColor = colorArray[index % colorArray.length];

  // Estado para controlar o modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handlePlayerPress = (jogador) => {
    setSelectedPlayer(jogador);
    setModalVisible(true);
  };

  const handleToggleLevantador = () => {
    if (selectedPlayer) {
      updatePlayerLevantador(selectedPlayer.id_usuario, !selectedPlayer.isLevantador);
      setSelectedPlayer({ ...selectedPlayer, isLevantador: !selectedPlayer.isLevantador });
    }
  };

  // Novo manipulador para Desvincular
  const handleDesvincular = (jogador) => {
    if (jogador) {
      onDesvincularPress(jogador); // Executa a ação de desvincular com o objeto completo
      setModalVisible(false); // Fecha o modal após a ação
    }
  };

  return (
    <View style={[styles.teamCard, { borderColor }]}>
      {/* Cabeçalho do Time */}
      <View style={styles.teamHeader}>
        <View style={styles.teamNameRow}>
          {isEditing ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.editNameInput}
                value={tempTeamName}
                onChangeText={setTempTeamName}
                onSubmitEditing={() => saveTeamName(index)}
              />
              <TouchableOpacity onPress={() => saveTeamName(index)}>
                <Ionicons name="checkmark" size={20} color="#FF9800" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.teamTitle}>
                {time.nomeTime || `Time ${index + 1}`}
              </Text>
              <TouchableOpacity onPress={() => onEditName(index)}>
                <Ionicons name="pencil-outline" size={18} color="#666" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Botão "Ver Nível do Time" */}
        <TouchableOpacity style={styles.viewTeamLevelButton} onPress={() => onOpenTeamLevel(index)}>
          <Text style={styles.viewTeamLevelText}>Ver Nível</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Jogadores */}
      <View style={styles.playersList}>
        {time.jogadores && time.jogadores.length > 0 ? (
          time.jogadores.map((jogador, idxJ) => {
            const itemStyle = [styles.jogadorItem];
            const nameStyle = [styles.jogadorNome];
            const posStyle = [styles.jogadorPosicao];

            if (jogador.isMe) {
              itemStyle.push(styles.jogadorEu);
              nameStyle.push(styles.jogadorEuNome);
              posStyle.push(styles.jogadorEuPosicao);
            }

            // Monta o nome final + revezando
            let nomeFinal = jogador.nome;
            if (jogador.revezandoCom && typeof jogador.revezandoCom === 'object') {
              nomeFinal += ` - (Revezando com ${jogador.revezandoCom.nome})`;
            }

            // Verifica se o jogador é levantador
            const exibirPosicao = jogador.isLevantador;

            // Adiciona estilo adicional se for levantador
            if (jogador.isLevantador) {
              itemStyle.push(styles.jogadorLevantador); // Novo estilo para levantadores
            }

            return (
              <TouchableOpacity
                key={`jogador-${idxJ}`}
                style={itemStyle}
                onPress={() => handlePlayerPress(jogador)}
                onLongPress={() => onMovePress(jogador, index)}
              >
                {/* Foto do Jogador */}
                {jogador.foto ? (
                  <Image source={{ uri: jogador.foto }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarCircle} />
                )}
                <Text style={nameStyle}>
                  {nomeFinal}
                  {jogador.isMe ? ' (Eu)' : ''}
                </Text>
                {exibirPosicao && <Text style={posStyle}>Levantador</Text>}
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyTeam}>Nenhum jogador neste time.</Text>
        )}
      </View>

      {/* Modal de Detalhes do Jogador */}
      <ModalJogadorDetalhes
        visible={modalVisible}
        jogador={selectedPlayer}
        onClose={() => setModalVisible(false)}
        toggleLevantador={handleToggleLevantador}
        onMovePress={() => onMovePress(selectedPlayer, index)}
        onRevezarPress={() => onRevezarPress(selectedPlayer)}
        onDesvincularPress={handleDesvincular} // Passa o novo manipulador
      />
    </View>
  );
};

export default TeamCard;

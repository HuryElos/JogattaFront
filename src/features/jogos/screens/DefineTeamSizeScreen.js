import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';

// Lista de animais (exemplo) para nomes de jogadores temporários
const ANIMALS_LIST = [
  'Leão', 'Girafa', 'Onça', 'Elefante', 'Zebra', 'Lobo',
  'Coruja', 'Panda', 'Macaco', 'Raposa', 'Falcão', 'Gato',
  'Cachorro', 'Cavalo', 'Coelho', 'Rinoceronte', 'Hipopótamo',
  'Avestruz', 'Búfalo', 'Castor', 'Esquilo', 'Pinguim', 'Tartaruga',
];

export default function DefineTeamSizeScreen({ route, navigation }) {
  // Recebe os jogadores vindos do HomeScreen
  const { players = [] } = route.params || [];

  // Estado para quantos jogadores por time
  const [playersPerTeam, setPlayersPerTeam] = useState(4);
  const options = [2, 3, 4, 5, 6];

  // Controle de modal (sobras >= 3)
  const [showPopUp, setShowPopUp] = useState(false);
  const [needExtraPlayers, setNeedExtraPlayers] = useState(0);

  // Quando o usuário clicar em "Confirmar"
  const handleConfirm = () => {
    const totalPlayers = players.length;
    // Quantos times completos cabem
    const fullTeams = Math.floor(totalPlayers / playersPerTeam);
    // Quantos sobram
    const leftover = totalPlayers % playersPerTeam;

    // Se não há sobra
    if (leftover === 0) {
      // Navega direto
      return goToManualScreen(players);
    }

    // Se sobra <= 2
    if (leftover <= 2) {
      Alert.alert(
        'Excedente/Revezar',
        `Há ${leftover} jogador(es) sobrando. Eles poderão revezar com os times formados.`,
        [
          {
            text: 'OK',
            onPress: () => goToManualScreen(players),
          },
        ]
      );
      return;
    }

    // Se leftover >= 3 => perguntar se quer criar jogadores temporários
    const diff = playersPerTeam - leftover; // quantos faltam p/ completar
    setNeedExtraPlayers(diff);
    setShowPopUp(true);
  };

  // Função para realmente navegar p/ ManualJogoScreen
  const goToManualScreen = (finalPlayers) => {
    navigation.navigate('ManualJogoScreen', {
      players: finalPlayers,       // lista final (com ou sem temporários)
      playersPerTeam: playersPerTeam,
    });
  };

  // Cria jogadores temporários p/ completar
  const handleCreateTempPlayers = () => {
    // Precisamos de 'needExtraPlayers' jogadores a mais
    const newPlayers = [];
    for (let i = 0; i < needExtraPlayers; i++) {
      const rIndex = Math.floor(Math.random() * ANIMALS_LIST.length);
      const animal = ANIMALS_LIST[rIndex] || 'Animal';

      newPlayers.push({
        id_usuario: null,  // ou algo que indique que é fake
        nome: `Temp ${animal}`,
        temporario: true,
      });
    }

    // Cria nova lista
    const updatedList = [...players, ...newPlayers];

    setShowPopUp(false);
    // Navega para a ManualJogoScreen com essa lista nova
    goToManualScreen(updatedList);
  };

  // Deixar time desfalcado => sem criar temporários
  const handleTimeWithOneLess = () => {
    setShowPopUp(false);
    goToManualScreen(players);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quantos jogadores por time?</Text>

      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.optionButton,
              playersPerTeam === opt && styles.optionButtonSelected,
            ]}
            onPress={() => setPlayersPerTeam(opt)}
          >
            <Text
              style={[
                styles.optionButtonText,
                playersPerTeam === opt && styles.optionButtonTextSelected,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.infoText}>
        Jogadores confirmados: {players.length}
      </Text>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Confirmar</Text>
      </TouchableOpacity>

      {/* Modal se leftover >= 3 => criar jogadores temporários ou deixar desfalcado */}
      <Modal
        visible={showPopUp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPopUp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {players.length} jogadores confirmados.
            </Text>
            <Text style={styles.modalText}>
              Faltam {needExtraPlayers} para formar todos os times completos. 
              Deseja criar jogadores temporários?
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleCreateTempPlayers}
              >
                <Text style={styles.modalButtonText}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={handleTimeWithOneLess}
              >
                <Text style={styles.modalButtonText}>Não, deixar desfalcado</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===============================
     Estilos (ajuste se quiser)
   =============================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#333',
  },
  optionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 6,
  },
  optionButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  optionButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  optionButtonTextSelected: {
    color: '#FFF',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 60,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

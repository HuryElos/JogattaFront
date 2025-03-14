import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  StyleSheet
} from 'react-native';

const EquilibrarTimesScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState('');

  // Pressiona um dos 3 botões
  const handleOptionPress = (mode) => {
    setSelectedMode(mode);
    setModalVisible(true);
  };

  // Ao confirmar no modal, navega para a tela correspondente
  const handleProceed = () => {
    setModalVisible(false);

    switch (selectedMode) {
      case 'manual':
        navigation.navigate('ConvidarAmigos', { fluxo: 'manual' });
        break;
      case 'habilidades':
        navigation.navigate('ConvidarAmigos', { fluxo: 'habilidades' });
        break;
      case 'galera':
        navigation.navigate('CriarJogo', { fluxo: 'dinamico' });
        break;
      default:
        break;
    }
  };

  // Define textos e imagens de cada opção
  const getModalContent = () => {
    switch (selectedMode) {
      case 'manual':
        return {
          title: 'Manual',
          description: 'Organize os times totalmente à mão, do seu jeito.',
          image: require('../../../../assets/images/screens/voleioff.png'),
        };
      case 'habilidades':
        return {
          title: 'Gerar times com Habilidades',
          description:
            'Equilibra os times automaticamente com base nas habilidades definidas.',
          image: require('../../../../assets/images/screens/voleioff.png'),
        };
      case 'galera':
        return {
          title: 'No ritmo da galera',
          description:
            'Cria sala dinâmica para jogar de forma interativa (fluxo atual).',
          image: require('../../../../assets/images/screens/voleion.png'),
        };
      default:
        return {
          title: '',
          description: '',
          image: null,
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Como você quer organizar?</Text>

      {/* Linha 1: Botão Manual e Botão Gerar Habilidades */}
      <View style={styles.buttonRow}>
        {/* Botão Manual */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleOptionPress('manual')}
            style={styles.mainButton}
          >
            <Image
              source={require('../../../../assets/images/screens/voleioff.png')}
              style={styles.image}
            />
          </TouchableOpacity>
          <Text style={styles.buttonTitle}>Manual</Text>
        </View>

        {/* Botão Gerar times com Habilidades */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleOptionPress('habilidades')}
            style={styles.mainButton}
          >
            <Image
              source={require('../../../../assets/images/screens/voleioff.png')}
              style={styles.image}
            />
          </TouchableOpacity>
          <Text style={styles.buttonTitle}>Gerar com Habilidades</Text>
        </View>
      </View>

      {/* Linha 2: Botão No ritmo da galera */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => handleOptionPress('galera')}
          style={styles.mainButton}
        >
          <Image
            source={require('../../../../assets/images/screens/voleion.png')}
            style={styles.image}
          />
        </TouchableOpacity>
        <Text style={styles.buttonTitle}>No ritmo da galera</Text>
      </View>

      {/* Modal de confirmação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {modalContent.image && (
              <Image source={modalContent.image} style={styles.modalImage} />
            )}

            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalText}>{modalContent.description}</Text>

            <Pressable style={styles.modalButton} onPress={handleProceed}>
              <Text style={styles.modalButtonText}>Prosseguir</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EquilibrarTimesScreen;

/**
 * Estilos mínimos, seguindo a ideia de wireframe:
 * sem sombras fortes ou cores chamativas, apenas
 * layout básico e espaçamentos.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  mainButton: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  image: {
    width: 80,
    height: 80,
  },
  buttonTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 280,
    padding: 16,
    borderRadius: 6,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  },
  modalImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EEE',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

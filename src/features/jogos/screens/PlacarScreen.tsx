import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  PanResponder,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  Image,
  GestureResponderEvent,
  PanResponderGestureState
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as Animatable from 'react-native-animatable';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';

interface PlacarProps {
  cor: string;
  pontuacao: number;
  onIncrement: () => void;
  onDecrement: () => void;
  fontSize: number;
}

const PlacarScreen: React.FC = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [pontuacaoTime1, setPontuacaoTime1] = useState<number>(0);
  const [pontuacaoTime2, setPontuacaoTime2] = useState<number>(0);

  const [setsTime1, setSetsTime1] = useState<number>(0);
  const [setsTime2, setSetsTime2] = useState<number>(0);


  const [isSettingsVisible, setIsSettingsVisible] = useState<boolean>(false);

  const [fontSize, setFontSize] = useState<number>(120);

  const [scoreEvent, setScoreEvent] = useState<boolean>(false);

  useFocusEffect(
    React.useCallback(() => {
      const handleOrientationChange = async () => {
        const { width, height } = Dimensions.get('window');
        const isLandscape = width > height;

        navigation.getParent()?.setOptions({
          tabBarStyle: isLandscape ? { display: 'none' } : undefined,
        });

        if (isLandscape) {
          await NavigationBar.setVisibilityAsync('hidden');
        } else {
          await NavigationBar.setVisibilityAsync('visible');
        }
      };

      handleOrientationChange();
      const subscription = Dimensions.addEventListener('change', handleOrientationChange);

      return () => {
        subscription?.remove();
        navigation.getParent()?.setOptions({ tabBarStyle: undefined });
        NavigationBar.setVisibilityAsync('visible');
      };
    }, [navigation])
  );



  const handleIncrement = (time: 1 | 2): void => {
    if (time === 1) {
      setPontuacaoTime1((prev) => prev + 1);
      setScoreEvent(true);
    }
    if (time === 2) {
      setPontuacaoTime2((prev) => prev + 1);
      setScoreEvent(true);
    }
  };

  const handleDecrement = (time: 1 | 2): void => {
    if (time === 1) setPontuacaoTime1((prev) => (prev > 0 ? prev - 1 : 0));
    if (time === 2) setPontuacaoTime2((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const resetPlacar = (): void => {
    setPontuacaoTime1(0);
    setPontuacaoTime2(0);
  };

  const saveSettings = (presetFontSize?: number): void => {

    if (presetFontSize) setFontSize(presetFontSize);
    setIsSettingsVisible(false);
  };

  const containerStyle = isLandscape ? styles.containerLandscape : styles.containerPortrait;
  const [navVisible, setNavVisible] = useState(true);
  const toggleNavVisibility = () => {
    setNavVisible((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={isLandscape} style="light" />

      <TouchableOpacity
        onPress={() => setIsSettingsVisible(true)}
        style={[
          styles.settingsButton,
          isLandscape ? styles.settingsButtonLandscape : styles.settingsButtonPortrait,
        ]}
      >
        <Ionicons name="settings-outline" size={30} color="#fff" />
      </TouchableOpacity>

      <View style={[styles.container, containerStyle]}>
        <Placar
          cor="#1E90FF"
          pontuacao={pontuacaoTime1}
          onIncrement={() => handleIncrement(1)}
          onDecrement={() => handleDecrement(1)}
          fontSize={fontSize}
        />

        <Placar
          cor="#F15A24"
          pontuacao={pontuacaoTime2}
          onIncrement={() => handleIncrement(2)}
          onDecrement={() => handleDecrement(2)}
          fontSize={fontSize}
        />
        <TouchableOpacity
          onPress={toggleNavVisibility}
          style={[
            styles.showButton,
            isLandscape ? styles.showButtonLandscape : styles.showButtonPortrait,
            !navVisible && { display: 'flex' }, // ou opacity: 0 se quiser animação
          ]}
        >
          <Ionicons name="chevron-down-outline" size={40} color="#fff" />
        </TouchableOpacity>




      </View>

      <Modal visible={isSettingsVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Configurações</Text>

            <Text style={styles.modalLabel}>Tamanho dos Números:</Text>
            <View style={styles.fontSizeOptions}>
              <TouchableOpacity style={styles.fontSizeButton} onPress={() => saveSettings(80)}>
                <Text style={styles.fontSizeButtonText}>Pequeno</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fontSizeButton} onPress={() => saveSettings(120)}>
                <Text style={styles.fontSizeButtonText}>Médio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fontSizeButton} onPress={() => saveSettings(160)}>
                <Text style={styles.fontSizeButtonText}>Grande</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={resetPlacar}>
              <Text style={styles.resetButtonText}>Resetar Placar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setIsSettingsVisible(false)}>
              <Text style={styles.modalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const AnimatableText = Animatable.createAnimatableComponent(Text);

const Placar: React.FC<PlacarProps> = ({ cor, pontuacao, onIncrement, onDecrement, fontSize }) => {
  const startY = useRef<number>(0);
  const textRef = useRef<any>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        startY.current = gestureState.y0;
      },
      onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const dy = gestureState.moveY - startY.current;
        if (dy > 30) onDecrement();
        else onIncrement();
      },
    })
  ).current;

  useEffect(() => {
    textRef.current?.pulse(600);
  }, [pontuacao]);

  return (
    <View {...panResponder.panHandlers} style={[styles.placarContainer, { backgroundColor: cor }]}>
      <AnimatableText
        ref={textRef}
        style={[styles.pontuacao, { fontSize }]}
      >
        {pontuacao}
      </AnimatableText>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },

  /*Settings Button*/

  settingsButton: {
    position: 'absolute',
    zIndex: 1,
  },
  settingsButtonPortrait: {
    top: 20,
    right: 15,
    marginTop: 20,
  },
  settingsButtonLandscape: {
    top: 20,
    right: 30,
  },


  /*show Button*/

  showButton: {
    position: 'absolute',
    zIndex: 1,
  },
  showButtonPortrait: {
     bottom: 10,
      left: '44%',
     
    
  },
  showButtonLandscape: {
    top: 20,
    right: 30,
  },


  /*Placar*/

  container: {
    flex: 1,
  },
  containerPortrait: {
    flexDirection: 'column',
  },
  containerLandscape: {
    flexDirection: 'row',
  },
  placarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pontuacao: {
    color: '#FFF',
    fontWeight: 'bold',
  },


  /*Modal*/
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    textAlign: 'center',
  },
  fontSizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  fontSizeButton: {
    backgroundColor: '#F15A24',
    padding: 10,
    borderRadius: 5,
  },
  fontSizeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#F15A24',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default PlacarScreen; 
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
  Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as Animatable from 'react-native-animatable';
import ConfettiCannon from 'react-native-confetti-cannon';

// Exemplo: se tiver o arquivo do logo do Jogatta, descomente e ajuste o caminho.
// import jogattaLogo from './assets/jogattaLogo.png';

const PlacarScreen = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [pontuacaoTime1, setPontuacaoTime1] = useState(0);
  const [pontuacaoTime2, setPontuacaoTime2] = useState(0);

  // Controlar sets
  const [setsTime1, setSetsTime1] = useState(0);
  const [setsTime2, setSetsTime2] = useState(0);

  const [metaPontos, setMetaPontos] = useState(12);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [novaMeta, setNovaMeta] = useState(metaPontos.toString());
  const [fontSize, setFontSize] = useState(120);

  // Para confete
  const [scoreEvent, setScoreEvent] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const handleOrientationChange = async () => {
        const { width, height } = Dimensions.get('window');
        const isLandscape = width > height;

        // Some telas podem impedir rotação se não estiver habilitado no app.json ou nativo
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

  // Efeito para checar se atingiu meta e incrementar set
  useEffect(() => {
    if (pontuacaoTime1 >= metaPontos) {
      setSetsTime1((prev) => prev + 1);
      resetPlacar();
    }
    if (pontuacaoTime2 >= metaPontos) {
      setSetsTime2((prev) => prev + 1);
      resetPlacar();
    }
  }, [pontuacaoTime1, pontuacaoTime2]);

  const handleIncrement = (time) => {
    if (time === 1 && pontuacaoTime1 < metaPontos) {
      setPontuacaoTime1((prev) => prev + 1);
      setScoreEvent(true); // Dispara confete
    }
    if (time === 2 && pontuacaoTime2 < metaPontos) {
      setPontuacaoTime2((prev) => prev + 1);
      setScoreEvent(true); // Dispara confete
    }
  };

  const handleDecrement = (time) => {
    if (time === 1) setPontuacaoTime1((prev) => (prev > 0 ? prev - 1 : 0));
    if (time === 2) setPontuacaoTime2((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const resetPlacar = () => {
    setPontuacaoTime1(0);
    setPontuacaoTime2(0);
  };

  const saveSettings = (presetFontSize) => {
    const novaMetaPontos = parseInt(novaMeta, 10);
    if (isNaN(novaMetaPontos) || novaMetaPontos <= 0) {
      alert('Digite uma meta válida.');
      return;
    }
    setMetaPontos(novaMetaPontos);
    if (presetFontSize) setFontSize(presetFontSize);
    setIsSettingsVisible(false);
  };

  // Define estilos diferentes para Portrait x Landscape
  // Aqui trocamos de "column" (empilhado) em retrato e "row" (lado a lado) em paisagem,
  // para ficar claro que houve mudança de orientação:
  const containerStyle = isLandscape ? styles.containerLandscape : styles.containerPortrait;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={isLandscape} style="light" />

     {/* Cabeçalho com logo e tagline (simples). Ajuste conforme sua imagem. */}
<View
  style={[
    styles.headerContainer,
    isLandscape ? styles.logoLandscape : styles.logoPortrait, // Aplica o estilo condicionalmente
  ]}
>
  {/* Se tiver imagem do logo, descomente:
  <Image
    source={jogattaLogo}
    style={styles.logo}
    resizeMode="contain"
  />
  */}
  <Text style={styles.logoText}>jogaTTa</Text>
</View>

        <TouchableOpacity
          onPress={() => setIsSettingsVisible(true)}
          style={[
            styles.settingsButton,
            isLandscape ? styles.settingsButtonLandscape : styles.settingsButtonPortrait,
          ]}
         >
         <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>

      {/* Se algum ponto foi marcado, dispare o confete */}
      {scoreEvent && (
        <ConfettiCannon
          count={25}
          origin={{ x: width / 2, y: height }}
          fadeOut
          onAnimationEnd={() => setScoreEvent(false)}
        />
      )}

      <View style={[styles.container, containerStyle]}>
        {/* Placar do Time 1 */}
        <Placar
          cor="#1E90FF" //
          pontuacao={pontuacaoTime1}
          onIncrement={() => handleIncrement(1)}
          onDecrement={() => handleDecrement(1)}
          fontSize={fontSize}
        />

        {/* Placar do Time 2 */}
        <Placar
          cor="#F15A24" // Outro tom de laranja
          pontuacao={pontuacaoTime2}
          onIncrement={() => handleIncrement(2)}
          onDecrement={() => handleDecrement(2)}
          fontSize={fontSize}
        />
      </View>

      {/* Indicador de sets */}
      <View style={styles.setsIndicatorContainer}>
        <View style={styles.setCircle}>
          <Text style={styles.setText}>{setsTime1}</Text>
        </View>
        <Text style={{ fontSize: 18, marginHorizontal: 5 }}>x</Text>
        <View style={styles.setCircle}>
          <Text style={styles.setText}>{setsTime2}</Text>
        </View>
      </View>

      {/* Modal de Configurações */}
      <Modal visible={isSettingsVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Configurações</Text>
            <Text style={styles.modalLabel}>Meta de Pontos:</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={novaMeta}
              onChangeText={setNovaMeta}
            />
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

const Placar = ({ cor, pontuacao, onIncrement, onDecrement, fontSize }) => {
  const startY = useRef(0);
  const textRef = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        startY.current = gestureState.y0;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dy = gestureState.moveY - startY.current;
        if (dy > 30) onDecrement();
        else onIncrement();
      },
    })
  ).current;

  // Dispara a animação quando o placar muda
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
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  // Caso queira usar uma imagem real do logo, ajuste aqui
  logo: {
    width: 120,
    height: 60,
  },
  logoPortrait: {
    marginTop: 25, // Margem maior no modo portrait
    marginBottom: 5,
    
  },
  logoLandscape: {
    marginTop: 10, // Margem menor no modo landscape
    marginBottom: 5,
  },
  logoText: {
    color: '#F15A24',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tagline: {
    marginTop: 2,
    color: '#666',
    fontSize: 14,
  },
  settingsButton: {
    position: 'absolute',
    zIndex: 10,
  },
  settingsButtonPortrait: {
    top: 20,
    right: 15,
    marginTop: 20,
  },
  settingsButtonLandscape: {
    top: 20,
    right: 30, // Ajuste conforme necessário para evitar sobreposição
  },
  settingsButtonText: {
    fontSize: 26, // Este valor controla o tamanho do ícone ⚙️
    color: '#333'
},
  container: {
    flex: 1,
  },
  // No retrato, vamos empilhar placares na vertical (um em cima do outro)
  containerPortrait: {
    flexDirection: 'column',
  },
  // No landscape, lado a lado (horizontal)
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
  // Sets
  setsIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
  setCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setText: {
    color: '#000',
    fontWeight: 'bold',
  },
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

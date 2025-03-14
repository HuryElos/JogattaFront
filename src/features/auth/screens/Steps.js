// src/features/onboarding/screens/StepsScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const StepsScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Valores para animações
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(0)).current;
  
  // Conteúdo das etapas
  const steps = [
    {
      id: 'step1',
      title: "Bem-Vindo ao Jogatta!",
      description: "Encontre sua equipe, participe de partidas e viva a paixão pelo esporte!",
      image: require('../../../../assets/images/stepbg.png') // Substitua pela imagem real
    },
    {
      id: 'step2',
      title: "Encontre Partidas",
      description: "Localize jogos próximos a você, reserve quadras e participe de campeonatos locais.",
      image: require('../../../../assets/images/stepbg.png') // Substitua pela imagem real
    },
    {
      id: 'step3',
      title: "Conecte-se com Jogadores",
      description: "Faça parte de uma comunidade de jogadores apaixonados por vôlei.",
      image: require('../../../../assets/images/stepbg.png') // Substitua pela imagem real
    },
    {
      id: 'step4',
      title: "Comece sua jornada",
      description: "Cadastre-se ou faça login para reservar quadras, conectar-se com outros jogadores e organizar partidas.",
      image: require('../../../../assets/images/stepbg.png') // Substitua pela imagem real
    }
  ];
  
  const animateNextStep = (nextIndex) => {
    // Fade out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Mudamos o índice
      setCurrentIndex(nextIndex);
      slideAnim.setValue(100);
      
      // Fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    });
  };
  
  // Animar o card deslizando para cima ao iniciar
  useEffect(() => {
    Animated.timing(cardSlideAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      animateNextStep(currentIndex + 1);
    }
  };
  
  const handleBack = () => {
    if (currentIndex > 0) {
      animateNextStep(currentIndex - 1);
    }
  };
  
  const handleSkip = () => {
    navigation.navigate('Login');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Image */}
      <View style={styles.imageContainer}>
        <Image
          source={steps[currentIndex].image}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>
      
      {/* Header com botões e indicadores */}
      <SafeAreaView style={styles.header}>
        {currentIndex > 0 ? (
          <TouchableOpacity 
            style={styles.backButton} 
            activeOpacity={0.8}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpace} />
        )}
        
        <View style={styles.indicatorContainer}>
          {steps.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.indicator,
                currentIndex === index ? styles.activeIndicator : {}
              ]}
            />
          ))}
        </View>
        
        {currentIndex < 3 ? (
          <TouchableOpacity 
            style={styles.skipButton} 
            activeOpacity={0.8}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpace} />
        )}
      </SafeAreaView>
      
      {/* Card de conteúdo */}
      <Animated.View 
        style={[
          styles.contentWrapper,
          {
            transform: [
              { translateY: cardSlideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0]
              }) }
            ]
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.contentCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim }
              ]
            }
          ]}
        >
          <Text style={styles.title}>{steps[currentIndex].title}</Text>
          <Text style={styles.description}>{steps[currentIndex].description}</Text>
          
          {currentIndex < 3 ? (
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.9}
              onPress={handleNext}
            >
              <Ionicons name="arrow-forward" size={22} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.finalButtonsContainer}>
              <TouchableOpacity 
                style={styles.registerButton} 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.buttonText}>Cadastrar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginButton} 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#28597C',
  },
  imageContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(40, 89, 124, 0.65)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySpace: {
    width: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#FF7014',
  },
  contentWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#37A0EC',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#545454',
    textAlign: 'center',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#FF7014',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF7014",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  finalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  registerButton: {
    backgroundColor: '#FF7014',
    borderRadius: 24,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF7014",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    flex: 1,
    marginRight: 10,
  },
  loginButton: {
    backgroundColor: '#37A0EC',
    borderRadius: 24,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#37A0EC",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default StepsScreen;
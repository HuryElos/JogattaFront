import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const NPSModal = ({ visible, onClose, onSubmit }) => {
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Textos de exemplo que podem ser facilmente substituídos
  const texts = {
    title: 'Sua opinião é importante para nós!',
    subtitle: 'De 0 a 10, o quanto você recomendaria nosso produto para um amigo?',
    feedbackPlaceholder: 'Conte-nos mais sobre sua experiência (opcional)',
    submitButton: 'Enviar avaliação',
    thankYouTitle: 'Obrigado pelo seu feedback!',
    thankYouMessage: 'Sua opinião nos ajuda a melhorar nossos serviços.',
    closeButton: 'Fechar',
  };

  // Funções para lidar com a animação
  const animateIn = () => {
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const animateOut = (callback) => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (callback) callback();
    });
  };

  // Calcular a cor com base na pontuação
  const getScoreColor = (value) => {
    if (value <= 6) return '#FF4B4B'; // Detratores - Vermelho
    if (value <= 8) return '#FFD700'; // Passivos - Amarelo
    return '#4CAF50';                 // Promotores - Verde
  };

  // Renderizar os botões de pontuação NPS (0-10)
  const renderScoreButtons = () => {
    const buttons = [];
    for (let i = 0; i <= 10; i++) {
      buttons.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.scoreButton,
            score === i && { backgroundColor: getScoreColor(i) }
          ]}
          onPress={() => setScore(i)}
        >
          <Text style={[styles.scoreButtonText, score === i && styles.scoreButtonTextSelected]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.scoreButtonsContainer}>
        {buttons}
      </View>
    );
  };

  // Renderizar os rótulos da escala (Pouco provável / Muito provável)
  const renderScaleLabels = () => (
    <View style={styles.scaleLabelsContainer}>
      <Text style={styles.scaleLabel}>Pouco provável</Text>
      <Text style={styles.scaleLabel}>Muito provável</Text>
    </View>
  );

  // Renderizar indicador de sentimento com base na pontuação
  const renderSentimentIndicator = () => {
    if (score === null) return null;
    
    let emoji, sentiment;
    if (score <= 6) {
      emoji = '😞';
      sentiment = 'Podemos melhorar!';
    } else if (score <= 8) {
      emoji = '😐';
      sentiment = 'Obrigado!';
    } else {
      emoji = '😃';
      sentiment = 'Excelente!';
    }

    return (
      <Animated.View 
        style={[
          styles.sentimentContainer,
          { opacity: animation, transform: [{ scale: animation }] }
        ]}
      >
        <Text style={styles.sentimentEmoji}>{emoji}</Text>
        <Text style={[styles.sentimentText, { color: getScoreColor(score) }]}>
          {sentiment}
        </Text>
      </Animated.View>
    );
  };

  // Exibir tela de feedback ou agradecimento com base no estado
  const renderContent = () => {
    if (submitted) {
      return (
        <View style={styles.thankYouContainer}>
          <AntDesign name="checkcircle" size={60} color="#4CAF50" />
          <Text style={styles.thankYouTitle}>{texts.thankYouTitle}</Text>
          <Text style={styles.thankYouMessage}>{texts.thankYouMessage}</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              animateOut(() => {
                onClose();
                // Resetar o estado após fechar
                setTimeout(() => {
                  setSubmitted(false);
                  setScore(null);
                  setFeedback('');
                }, 300);
              });
            }}
          >
            <Text style={styles.closeButtonText}>{texts.closeButton}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{texts.title}</Text>
        <Text style={styles.subtitle}>{texts.subtitle}</Text>
        
        {renderScoreButtons()}
        {renderScaleLabels()}
        {renderSentimentIndicator()}
        
        <TextInput
          style={styles.feedbackInput}
          placeholder={texts.feedbackPlaceholder}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={3}
          maxLength={250}
        />
        
        <TouchableOpacity 
          style={[styles.submitButton, !score && styles.submitButtonDisabled]}
          disabled={score === null}
          onPress={() => {
            if (score !== null) {
              onSubmit && onSubmit({ score, feedback });
              setSubmitted(true);
            }
          }}
        >
          <Text style={styles.submitButtonText}>
            {texts.submitButton}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Efeito de animação quando a pontuação muda
  React.useEffect(() => {
    if (score !== null) {
      animateIn();
    }
  }, [score]);

  // Controlar o modal
  React.useEffect(() => {
    if (visible) {
      // Inicia a animação quando o modal é aberto
      animation.setValue(0);
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
      
      setSubmitted(false);
    }
  }, [visible]);

  // A animação do modal principal
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height, 0],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        animateOut(onClose);
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.closeIcon} 
              onPress={() => animateOut(onClose)}
            >
              <AntDesign name="close" size={24} color="#999" />
            </TouchableOpacity>
            
            {renderContent()}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1001,
  },
  closeIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1002,
    padding: 5,
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  scoreButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '110%',
    marginBottom: 5,
   
  },
  scoreButton: {
    width: 25,
    height: 25,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  scoreButtonText: {
    fontSize: 16,
    color: '#555',
  },
  scoreButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  scaleLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  scaleLabel: {
    fontSize: 12,
    color: '#777',
  },
  sentimentContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sentimentEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  sentimentText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  thankYouContainer: {
    alignItems: 'center',
    padding: 20,
  },
  thankYouTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  thankYouMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#007BFF',
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NPSModal;
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Popover from 'react-native-popover-view';

const TutorialOverlay = ({ targetRefs }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasShownTutorial, setHasShownTutorial] = useState(false);
  const [targetLayout, setTargetLayout] = useState(null);

  const steps = useMemo(
    () => [
      { target: 'timeSelector', text: 'Escolha quantos jogadores cada time terá' },
      { target: 'levantadorSwitch', text: 'Toque aqui para definir levantadores' },
      { target: 'editButton', text: 'Clique para ajustar habilidades detalhadas' },
    ],
    []
  );

  const measureTarget = useCallback(() => {
    if (currentStep >= steps.length) return;

    const stepInfo = steps[currentStep];
    const targetRef = targetRefs && targetRefs[stepInfo.target]?.current;

    if (targetRef && targetRef.measureInWindow) {
      targetRef.measureInWindow((x, y, width, height) => {
        // Offset padrão para todos os passos
        let offsetY = 50;

        // Se for o primeiro passo (currentStep === 0), aplica um offset diferente
        if (currentStep === 0) {
          offsetY = 20; // <-- Alteração para o primeiro passo
        }

        setTargetLayout({
          x,
          y: y + offsetY, // Aqui o offset é aplicado
          width,
          height,
        });
      });
    } else {
      // Fallback: posição padrão
      setTargetLayout({ x: 100, y: 100, width: 1, height: 1 });
    }
  }, [currentStep, targetRefs, steps]);

  useFocusEffect(
    useCallback(() => {
      if (!hasShownTutorial) {
        setCurrentStep(0);
        setHasShownTutorial(true);
      }
    }, [hasShownTutorial])
  );

  useEffect(() => {
    measureTarget();
  }, [currentStep, measureTarget]);

  if (currentStep >= steps.length) {
    return null;
  }

  return (
    targetLayout && (
      <Popover
        isVisible={true}
        from={targetLayout}
        onRequestClose={() => setCurrentStep((prev) => prev + 1)}
        backgroundStyle={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        <View style={styles.tutorialBubble}>
          <Text style={styles.tutorialText}>{steps[currentStep].text}</Text>
          <TouchableOpacity
            style={styles.tutorialButton}
            onPress={() => setCurrentStep((prev) => prev + 1)}
          >
            <Text style={styles.tutorialButtonText}>
              {currentStep < steps.length - 1 ? 'Próximo' : 'Começar!'}
            </Text>
          </TouchableOpacity>
        </View>
      </Popover>
    )
  );
};

const styles = StyleSheet.create({
  tutorialBubble: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  tutorialText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  tutorialButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  tutorialButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default TutorialOverlay;

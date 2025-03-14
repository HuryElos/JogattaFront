import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const ModalHabilidades = ({
  jogador,
  onClose,
  atualizarHabilidades,
  confirmarSalvarHabilidades,
}) => {
  if (!jogador) return null;

  const [isSaving, setIsSaving] = useState(false);

  // Shared values para animar o botão de salvar
  const backgroundProgress = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  const skills = [
    { label: 'Passe', key: 'passe' },
    { label: 'Ataque', key: 'ataque' },
    { label: 'Levantamento', key: 'levantamento' },
  ];

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // Anima cor do botão (roxo -> verde)
    backgroundProgress.value = 0;
    backgroundProgress.value = withTiming(1, { duration: 600, easing: Easing.linear });

    // Anima o ícone (pequeno "pulse" e rotação)
    iconScale.value = withSequence(
      withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) })
    );
    iconRotation.value = withSequence(
      withTiming(15, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) })
    );

    try {
      await confirmarSalvarHabilidades();
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 800);
    } catch (error) {
      setIsSaving(false);
    }
  };

  // Animação de cor do botão
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      backgroundProgress.value,
      [0, 1],
      ['#4F46E5', '#34D399']
    );
    return { backgroundColor };
  });

  // Animação do ícone (escala + rotação)
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  return (
    <Modal 
      transparent 
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent // Para ocupar a tela toda no Android
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalContainer, { marginVertical: 50 }]}>
          <Text style={styles.modalTitle}>Habilidades do Jogador</Text>

          {skills.map((skill) => (
            <SkillRow
              key={skill.key}
              label={skill.label}
              skillValue={jogador[skill.key]}
              onValueChange={(value) => atualizarHabilidades(skill.key, value)}
            />
          ))}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            >
              {isSaving && (
                <Animated.View style={[StyleSheet.absoluteFill, animatedBackgroundStyle]} />
              )}
              {isSaving ? (
                <Animated.View style={animatedIconStyle}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                </Animated.View>
              ) : (
                <>
                  <Text style={styles.saveText}>Salvar Alterações</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SkillRow = ({ label, skillValue, onValueChange }) => {
  return (
    <View style={styles.skillRow}>
      <Text style={styles.skillLabel}>{label}</Text>

      <Slider
        value={skillValue}
        minimumValue={1}
        maximumValue={5}
        step={1}
        minimumTrackTintColor="#4F46E5"
        maximumTrackTintColor="#E5E7EB"
        thumbTintColor="#4F46E5"
        onValueChange={onValueChange}
      />

      <View style={styles.skillBubbles}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Bubble
            key={num}
            number={num}
            skillValue={skillValue}
            onPress={onValueChange}
          />
        ))}
      </View>
    </View>
  );
};

const Bubble = ({ number, skillValue, onPress }) => {
  // “Pulse” ao ficar ativo
  const isActive = number <= skillValue;
  const scale = useSharedValue(1);
  const prevActive = useRef(isActive);

  useEffect(() => {
    if (!prevActive.current && isActive) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 100, easing: Easing.ease }),
        withTiming(1, { duration: 100, easing: Easing.ease })
      );
    }
    prevActive.current = isActive;
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isActive ? '#4F46E5' : '#F3F4F6',
  }));

  return (
    <TouchableWithoutFeedback onPress={() => onPress(number)}>
      <Animated.View style={[styles.bubble, animatedStyle]}>
        <Text style={[styles.bubbleText, isActive && styles.activeBubbleText]}>
          {number}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default ModalHabilidades;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    position: 'absolute', // Garante sobreposição total
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  skillRow: {
    marginBottom: 24,
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
  },
  skillBubbles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  activeBubbleText: {
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
    marginRight: 4,
  },
});

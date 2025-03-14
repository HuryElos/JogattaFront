// src/features/jogo/components/Toast.js

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const Toast = ({ message, visible }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1);
      translateY.value = withSpring(0);
    } else {
      opacity.value = withTiming(0, { duration: 500 });
      translateY.value = withTiming(50, { duration: 500 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // **Adicionado: Retornar null quando não visível**
  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 60,
    left: '10%',
    right: '10%',
    backgroundColor: '#323232',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1000, // **Ajustado para um valor mais alto**
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default Toast;

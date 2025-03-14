import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ModoSelector = ({ mode, setMode }) => {
  const [expanded, setExpanded] = useState(false);
  // Valor inicial para a animação. Se estiver colapsado, altura menor, etc.
  const animationHeight = useRef(new Animated.Value(60)).current;

  const toggleExpand = () => {
    const finalValue = expanded ? 60 : 150; // altura “fechada” vs. “aberta”
    Animated.timing(animationHeight, {
      toValue: finalValue,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setExpanded(!expanded);
    });
  };

  // Texto descritivo de cada modo
  const getDescription = (m) => {
    switch (m) {
      case 'habilidades':
        return 'Equilibra pelos atributos (passe, ataque, levant.)';
      case 'levantadores':
        return 'Selecione manualmente os levantadores';
      case 'randomico':
        return 'Distribui todos aleatoriamente';
      default:
        return '';
    }
  };

  return (
    <Animated.View style={[styles.container, { height: animationHeight }]}>
      {/* Botão de expandir/colapsar */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#007AFF"
        />
      </TouchableOpacity>

      <View style={styles.modesRow}>
        {/* Botão Habilidades */}
        <TouchableOpacity
          style={[styles.iconWrapper, mode === 'habilidades' && styles.iconWrapperSelected]}
          onPress={() => setMode('habilidades')}
        >
          <Ionicons
            name="analytics-outline"
            size={25}
            color={mode === 'habilidades' ? '#FFF' : '#333'}
          />
          {expanded && <Text style={[styles.labelText, mode === 'habilidades' && styles.labelTextSelected]}>Habilidades</Text>}
        </TouchableOpacity>

        {/* Botão Levantadores */}
        <TouchableOpacity
          style={[styles.iconWrapper, mode === 'levantadores' && styles.iconWrapperSelected]}
          onPress={() => setMode('levantadores')}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={25}
            color={mode === 'levantadores' ? '#FFF' : '#333'}
          />
          {expanded && <Text style={[styles.labelText, mode === 'levantadores' && styles.labelTextSelected]}>Levantadores</Text>}
        </TouchableOpacity>

        {/* Botão Aleatório */}
        <TouchableOpacity
          style={[styles.iconWrapper, mode === 'randomico' && styles.iconWrapperSelected]}
          onPress={() => setMode('randomico')}
        >
          <Ionicons
            name="shuffle-outline"
            size={25}
            color={mode === 'randomico' ? '#FFF' : '#333'}
          />
          {expanded && <Text style={[styles.labelText, mode === 'randomico' && styles.labelTextSelected]}>Aleatório</Text>}
        </TouchableOpacity>
      </View>

      {/* Se expandido, mostra o texto extra do modo selecionado */}
      {expanded && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{getDescription(mode)}</Text>
        </View>
      )}
    </Animated.View>
  );
};

export default ModoSelector;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    overflow: 'hidden', // Necessário para não “vazar” a animação
    marginBottom: 10,
    borderRadius: 8,
  },
  toggleButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    padding: 8,
    flexDirection: 'row',
    minWidth: 40,
  },
  iconWrapperSelected: {
    backgroundColor: '#007AFF',
  },
  labelText: {
    color: '#333',
    marginLeft: 5,
  },
  labelTextSelected: {
    color: '#FFF',
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  descriptionText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
});

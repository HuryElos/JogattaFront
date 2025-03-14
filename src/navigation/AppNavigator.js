// src/navigation/AppNavigator.js

import React, { useState, useEffect, useRef } from 'react';
import { 
  Dimensions, 
  View, 
  Text, 
  StyleSheet, 
  Platform,
  TouchableOpacity,
  Animated
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Telas principais (Home, Amigos, etc.)
import HomeScreen from '../screens/HomeScreen';
import AdicionarAmigos from '../features/amigos/screens/AdicionarAmigos';
import EditProfileScreen from '../features/perfil/screens/EditProfileScreen';
import JogosStackNavigator from './JogosStackNavigator';
import PlacarScreen from '../features/jogos/screens/PlacarScreen';
import LiveRoomScreen from '../features/jogos/screens/LiveRoomScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CompanyDetailsScreen from '../features/user/screens/CompanyDetailsScreen';

// Telas de Admin (opcional no fluxo do user)
import CriarQuadraScreen from '../features/admin/screens/CriarQuadraScreen';
import GerenciarQuadraScreen from '../features/quadras/screens/GerenciarQuadraScreen';

// Tela de explorar quadras (usuário comum)
import ExploreQuadrasScreen from '../features/user/screens/ExploreQuadras';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function GeneralStackNavigator() {
  return (
    <Stack.Navigator>
      {/* HOME */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      {/* Sala ao vivo */}
      <Stack.Screen
        name="LiveRoom"
        component={LiveRoomScreen}
        options={{ title: 'Sala ao Vivo' }}
      />

      {/* Quadras (admin) - se quiser no fluxo do user */}
      <Stack.Screen
        name="CriarQuadra"
        component={CriarQuadraScreen}
        options={{ title: 'Criar Quadra' }}
      />
      <Stack.Screen
        name="GerenciarQuadra"
        component={GerenciarQuadraScreen}
        options={{ title: 'Gerenciar Quadra' }}
      />

      {/* Empresa e Explorar Quadras */}
      <Stack.Screen
        name="CompanyDetails"
        component={CompanyDetailsScreen}
        options={{ title: 'Empresa' }}
      />
      <Stack.Screen
        name="ExploreQuadras"
        component={ExploreQuadrasScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Stack do Perfil
function PerfilStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </Stack.Navigator>
  );
}

// Componente personalizado para o Tab Bar
function CustomTabBar({ state, descriptors, navigation }) {
  // Posição horizontal do botão selecionado (para animar bolinha)
  const tabPositions = useRef(new Array(state.routes.length).fill(0)).current;
  
  // Largura total aproximada da tab bar (para calcular posições relativas)
  const tabBarWidth = Dimensions.get('window').width;
  const tabWidth = tabBarWidth / state.routes.length;
  
  // Animações
  const bubblePosition = useRef(new Animated.Value(tabWidth * 2)).current; // Começa na posição do "Equilibrar"
  const bubbleScale = useRef(new Animated.Value(1)).current;
  
  // Quando o tab selecionado muda, atualiza a posição da bolinha
  useEffect(() => {
    // Adicione um deslocamento para a direita (ajuste o valor conforme necessário)
    const offsetRight = 20;
    const currentTabPosition = tabPositions[state.index] || tabWidth * state.index;

    Animated.parallel([
      Animated.spring(bubblePosition, {
        toValue: currentTabPosition + offsetRight,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(bubbleScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, [state.index]);

  return (
    <View style={styles.tabBarContainer}>
      {/* Bolinha animada que segue a seleção */}
      <Animated.View 
        style={[
          styles.animatedBubbleContainer,
          {
            transform: [
              { translateX: bubblePosition },
              { scale: bubbleScale }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#FF7014', '#FF8A3D']}
          style={styles.specialTabButton}
        >
          {state.routes[state.index] && (
            <Ionicons 
              name={getIconName(state.routes[state.index].name, true)} 
              size={24} 
              color="#FFFFFF" 
            />
          )}
        </LinearGradient>
      </Animated.View>

      {/* Itens da tab bar */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          // Guarda a posição deste tab para animar a bolinha
          tabPositions[index] = tabWidth * index;
          
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity 
            key={index} 
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            activeOpacity={0.8}
            onLayout={(event) => {
              // Guarda posição de cada item para animar a bolinha
              const { x, width } = event.nativeEvent.layout;
              tabPositions[index] = x + (width / 2) - (styles.specialTabButtonContainer.width / 2);
            }}
          >
            {/* Ícone do tab (visível apenas quando não selecionado) */}
            <View style={[styles.iconContainer, isFocused && styles.iconHidden]}>
              <Ionicons 
                name={getIconName(route.name, isFocused)} 
                size={24} 
                color={isFocused ? '#37A0EC' : '#999'} 
              />
            </View>
            
            {/* Label do tab */}
            <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Função auxiliar para obter o nome do ícone
function getIconName(routeName, isFocused) {
  let iconName;
  if (routeName === 'HomeTab') iconName = isFocused ? 'home' : 'home-outline';
  else if (routeName === 'Amigos') iconName = isFocused ? 'people' : 'people-outline';
  else if (routeName === 'Equilibrar Times') iconName = 'repeat';
  else if (routeName === 'Perfil') iconName = isFocused ? 'person' : 'person-outline';
  else if (routeName === 'Placar') iconName = isFocused ? 'list' : 'list-outline';
  return iconName;
}

export default function AppNavigator() {
  const [isLandscape, setIsLandscape] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window: { width, height } }) => {
      setIsLandscape(width > height);
    });
    return () => subscription?.remove();
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="HomeTab" // Inicializa na aba que tem a bolinha laranja
      tabBar={props => {
        // Verificamos se a tela atual é "Placar" e se está em modo paisagem
        const currentRoute = props.state.routes[props.state.index];
        return (currentRoute.name === 'Placar' && isLandscape) 
          ? null 
          : <CustomTabBar {...props} />;
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Aba da Home */}
      <Tab.Screen
        name="HomeTab"
        component={GeneralStackNavigator}
        options={{ title: 'Início' }}
      />

      {/* Aba de Amigos */}
      <Tab.Screen
        name="Amigos"
        component={AdicionarAmigos}
        options={{ title: 'Amigos' }}
      />

      {/* Aba de Equilibrar Times (fluxo de jogos) */}
      <Tab.Screen
        name="Equilibrar Times"
        component={JogosStackNavigator}
        options={{ title: 'Equilibrar' }}
      />

      {/* Aba de Perfil */}
      <Tab.Screen
        name="Perfil"
        component={PerfilStackNavigator}
        options={{ title: 'Perfil' }}
      />

      {/* Aba de Placar */}
      <Tab.Screen
        name="Placar"
        component={PlacarScreen}
        options={{ title: 'Placar' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 80 : 65,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#37A0EC',
    fontWeight: '500',
  },
  tabLabelInactive: {
    color: '#999',
  },
  animatedBubbleContainer: {
    position: 'absolute',
    // Ajuste vertical se quiser centralizar a bolinha no meio da barra
    // Exemplo:
    // top: '50%',
    // marginTop: -21,
    top: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    zIndex: 1,
  },
  specialTabButtonContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  specialTabButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconHidden: {
    opacity: 0,
  },
});

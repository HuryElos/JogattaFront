// src/navigation/AppNavigator.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dimensions, 
  View, 
  Text, 
  StyleSheet, 
  Platform,
  TouchableOpacity,
  Animated,
  Image
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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

/**
 * Função que retorna o ícone local de cada rota.
 * Ajuste os nomes dos arquivos caso sejam diferentes.
 */
function getLocalIcon(routeName) {
  switch (routeName) {
    case 'HomeTab':
      return require('../../assets/icons/home.png');
    case 'Partidas':
      return require('../../assets/icons/sports_volleyball.png');
    case 'Equilibrar Times':
      return require('../../assets/icons/scoreboard.png');
    case 'Perfil':
      return require('../../assets/icons/person.png');
    default:
      // Ícone genérico (fallback)
      return require('../../assets/icons/home.png');
  }
}

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

      {/* Quadras (admin) */}
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

/** 
 * Tela temporária para "Partidas"
 * (caso não esteja implementada ainda)
 */
function PartidasTemporaryScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
        Em breve!
      </Text>
      <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
        A tela de Partidas está em desenvolvimento e estará disponível em breve.
      </Text>
    </View>
  );
}

/**
 * Componente personalizado para o Tab Bar
 * com animação de bolinha que segue a aba selecionada
 * e usando imagens locais em vez de Ionicons.
 */
function CustomTabBar({ state, descriptors, navigation }) {
  // Posição de cada aba (para animar a bolinha)
  const tabPositions = useRef(new Array(state.routes.length).fill(0)).current;
  // Largura total aproximada da tab bar
  const tabBarWidth = Dimensions.get('window').width;
  const tabWidth = tabBarWidth / state.routes.length;

  // Animações
  const bubblePosition = useRef(new Animated.Value(tabWidth * 2)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;

  // Efeito para mover a bolinha quando o tab muda
  useEffect(() => {
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
      {/* Bolinha animada */}
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
          {/* Ícone que aparece dentro da bolinha (aba selecionada) */}
          {state.routes[state.index] && (
            <Image
              source={getLocalIcon(state.routes[state.index].name)}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          )}
        </LinearGradient>
      </Animated.View>

      {/* Itens da tab */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          // Guarda a posição deste item para mover a bolinha
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
            onPress={onPress}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              // Ajuste para posicionar a bolinha centralizada sobre o botão
              tabPositions[index] = x + (width / 2) - (styles.specialTabButtonContainer.width / 2);
            }}
          >
            {/* Ícone quando não está selecionado */}
            <View style={[styles.iconContainer, isFocused && styles.iconHidden]}>
              <Image
                source={getLocalIcon(route.name)}
                style={[
                  { width: 24, height: 24 },
                  // Se a imagem for neutra (branca/transparente),
                  // você pode aplicar tintColor para mudar cor de foco
                  { tintColor: isFocused ? '#37A0EC' : '#999' }
                ]}
                resizeMode="contain"
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
      initialRouteName="HomeTab"
      tabBar={props => <CustomTabBar {...props} />}
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

      {/* Aba de Partidas (temporária ou definitiva) */}
      <Tab.Screen
        name="Partidas"
        component={PartidasTemporaryScreen}
        options={{ title: 'Partidas' }}
      />

      {/* Aba de Placar (Equilibrar Times) */}
      <Tab.Screen
        name="Equilibrar Times"
        component={PlacarScreen}
        options={{ title: 'Placar' }}
      />

      {/* Aba de Perfil */}
      <Tab.Screen
        name="Perfil"
        component={PerfilStackNavigator}
        options={{ title: 'Perfil' }}
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
    // Ajuste vertical se quiser centralizar a bolinha (por ex. no meio da barra)
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

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

// Telas principais
import HomeScreen from '../screens/HomeScreen';
import AdicionarAmigos from '../features/amigos/screens/AdicionarAmigos';
import EditProfileScreen from '../features/perfil/screens/EditProfileScreen';
import JogosStackNavigator from './JogosStackNavigator'; // fluxo de jogos
import PlacarScreen from '../features/jogos/screens/PlacarScreen';
import LiveRoomScreen from '../features/jogos/screens/LiveRoomScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CompanyDetailsScreen from '../features/user/screens/CompanyDetailsScreen';
import PartidasStackNavigator from './PartidasStackNavigator'; // Nova navegação para Partidas

// Telas de Admin
import CriarQuadraScreen from '../features/admin/screens/CriarQuadraScreen';
import GerenciarQuadraScreen from '../features/quadras/screens/GerenciarQuadraScreen';
import AdminCompanyDetailsScreen from '../features/admin/screens/AdminCompanyDetailsScreen';

// Tela de explorar quadras (usuário comum)
import ExploreQuadrasScreen from '../features/user/screens/ExploreQuadras';

// Importação do OnboardingNavigator já pronto
import OnboardingNavigator from '../features/admin/onboarding/OnboardingNavigator';

// ---------------------------------------------------------------------
// Stacks
// ---------------------------------------------------------------------
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/* Ícone local para cada rota */
function getLocalIcon(routeName) {
  switch (routeName) {
    case 'HomeTab':
      return require('../../assets/icons/home.png');
    case 'Partidas':
      return require('../../assets/icons/sports_volleyball.png');
    case 'Placar':
      return require('../../assets/icons/scoreboard.png');
    case 'Perfil':
      return require('../../assets/icons/person.png');
    default:
      return require('../../assets/icons/home.png');
  }
}

/**
 * Stack principal da Home (GeneralStackNavigator).
 */
function GeneralStackNavigator() {
  return (
    <Stack.Navigator>
      {/* HOME */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      {/* Fluxo de Jogos */}
      <Stack.Screen
        name="JogosFlow"
        component={JogosStackNavigator}
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

      {/* Onboarding */}
      <Stack.Screen
        name="OnboardingNavigator"
        component={OnboardingNavigator}
        options={{ headerShown: false }}
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

      {/* Tela de detalhes da empresa para admin */}
      <Stack.Screen
        name="AdminCompanyDetails"
        component={AdminCompanyDetailsScreen}
        options={{ title: 'Detalhes da Empresa' }}
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
 * Custom TabBar com animação da "bolinha" (bubble).
 */
function CustomTabBar({ state, descriptors, navigation }) {
  const tabPositions = useRef(new Array(state.routes.length).fill(0)).current;
  const tabBarWidth = Dimensions.get('window').width;
  const tabWidth = tabBarWidth / state.routes.length;
  const bubbleWidth = 55; // Largura da bolinha

  // Animações
  const bubblePosition = useRef(new Animated.Value(tabWidth * 2)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const currentTabPosition = (tabWidth - bubbleWidth) / 2 + (tabWidth * state.index);

    Animated.parallel([
      Animated.spring(bubblePosition, {
        toValue: currentTabPosition,
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
          colors={['#fffff1', '#ffffff']}
          style={styles.specialTabButton}
        >
          {state.routes[state.index] && (
            <Image
              source={getLocalIcon(state.routes[state.index].name)}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          )}
        </LinearGradient>
      </Animated.View>

      {/* Ícones das abas */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
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
              tabPositions[index] = x + (width / 2) - (styles.specialTabButtonContainer.width / 2);
            }}
          >
            <View style={[styles.iconContainer, isFocused && styles.iconHidden]}>
              <Image
                source={getLocalIcon(route.name)}
                style={[
                  { width: 24, height: 24 },
                  { tintColor: isFocused ? '#37A0EC' : '#49454F' }
                ]}
                resizeMode="contain"
              />

              <Text style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {label}
            </Text>
            </View>
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* ABA DA HOME */}
      <Tab.Screen
        name="HomeTab"
        component={GeneralStackNavigator}
        options={{ title: 'Início' }}
      />

      {/* ABA DE PARTIDAS */}
      <Tab.Screen
        name="Partidas"
        component={PartidasStackNavigator}
        options={{ title: 'Partidas' }}
      />

      {/* ABA DE PLACAR */}
      <Tab.Screen
        name="Placar"
        component={PlacarScreen}
        options={{ title: 'Placar' }}
      />

      {/* ABA DE PERFIL */}
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
    backgroundColor: '#FF8A3D',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    alignItems: 'center',
    height: 75,
    marginBottom: 0,
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
    color: '#000000',
    fontWeight: '500',
  },
  tabLabelInactive: {
    color: '#49454F',
  },
  animatedBubbleContainer: {
    position: 'absolute',
    
    top: 5,
    width: 55,
    height: 35,
    borderRadius: 50,
    overflow: 'hidden',
    zIndex: 1,
  },
  specialTabButtonContainer: {
    width: 42,
    height: 42,
    
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  specialTabButton: {
    width: '100%',
    
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    
    height: 24,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconHidden: {
    
    opacity: 100,
  },
});

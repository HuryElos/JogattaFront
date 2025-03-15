import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native'; // Importar LogBox
import './src/config/intl'; // Importando a configuração do Intl

// Ignorar warnings específicos
LogBox.ignoreLogs([
  "The action 'RESET' with payload", // Ignorar o warning de 'RESET'
]);

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simula carregamento
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync(); // Esconde a splash
      }
    };

    prepareApp();
  }, []);

  return (
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}

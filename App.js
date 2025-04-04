import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox, Text, View } from 'react-native'; // <-- adicionei Text/View pra debugging
import './src/config/intl';
import { StripeProvider } from '@stripe/stripe-react-native';
import { CompanyProvider } from './src/contexts/CompanyContext';

LogBox.ignoreLogs([
  "The action 'RESET' with payload",
]);

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  console.log('[APP] Renderizando árvore de contexto');

  return (
    <CompanyProvider>
      <AuthProvider>
        <PaperProvider>
          <StripeProvider publishableKey="pk_test_51N82cjDQ9JlHtXKK1xwPHGTbaa9IBeag6iImYX0R0Ce2GJOvRfSMSS2KzJII5xkZ1bavgWrmFrBjQ7TNDsiKvgOc0096dfHBBO">
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </StripeProvider>
        </PaperProvider>
      </AuthProvider>
    </CompanyProvider>
  );
}

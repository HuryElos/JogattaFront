import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../src/navigation/RootNavigator';
import { AuthProvider } from '../src/contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

// Impede o splash screen de sair automaticamente
SplashScreen.preventAutoHideAsync();

export default function App() {
    useEffect(() => {
        const prepareApp = async () => {
            try {
                // Simula carregamento de dados
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (e) {
                console.warn(e);
            } finally {
                // Esconde o splash screen
                await SplashScreen.hideAsync();
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

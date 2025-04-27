import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Telas do onboarding
import IntroOnboardingScreen from './screens/IntroOnboardingScreen';
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import BankInfoScreen from './screens/BankInfoScreen';
import ConfirmOnboardingScreen from './screens/ConfirmOnboardingScreen';

// Contexto de formulário
import { OnboardingFormProvider } from './useOnboardingForm';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <OnboardingFormProvider>
      <Stack.Navigator
        initialRouteName="Intro"
        screenOptions={{
          headerShown: true,
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="Intro"
          component={IntroOnboardingScreen}
          options={{ title: 'Receba com o Jogatta' }}
        />
        <Stack.Screen
          name="PersonalInfo"
          component={PersonalInfoScreen}
          options={{ title: 'Seus dados pessoais' }}
        />
        <Stack.Screen
          name="BankInfo"
          component={BankInfoScreen}
          options={{ title: 'Dados bancários' }}
        />
        <Stack.Screen
          name="ConfirmOnboarding"
          component={ConfirmOnboardingScreen}
          options={{ title: 'Confirmação' }}
        />
      </Stack.Navigator>
    </OnboardingFormProvider>
  );
}

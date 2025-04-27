// 📁 src/navigation/GestorStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ManageCompanyScreen from '../features/admin/screens/ManageCompanyScreen';
import CriarQuadraScreen from '../features/admin/screens/CriarQuadraScreen';
import GerenciarQuadraScreen from '../features/quadras/screens/GerenciarQuadraScreen';
import OnboardingNavigator from '../features/admin/onboarding/OnboardingNavigator'; // 👈 import do onboarding

const Stack = createStackNavigator();

export default function GestorStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ManageCompany" 
        component={ManageCompanyScreen} 
      />
      
      <Stack.Screen 
        name="CreateQuadra" 
        component={CriarQuadraScreen} 
        options={{ 
          headerShown: true, 
          title: 'Criar Quadra' 
        }}
      />
      
      <Stack.Screen 
        name="GerenciarQuadra" 
        component={GerenciarQuadraScreen} 
        options={{ 
          headerShown: true, 
          title: 'Gerenciar Quadra' 
        }}
      />

      <Stack.Screen 
        name="OnboardingNavigator" 
        component={OnboardingNavigator} 
        options={{ headerShown: false }} // 👈 deixa o navigator cuidar do cabeçalho
      />
    </Stack.Navigator>
  );
}

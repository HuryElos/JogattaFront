// src/navigation/GestorStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ManageCompanyScreen from '../features/admin/screens/ManageCompanyScreen';
import CriarQuadraScreen from '../features/admin/screens/CriarQuadraScreen';
import GerenciarQuadraScreen from '../features/quadras/screens/GerenciarQuadraScreen';

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
    </Stack.Navigator>
  );
}
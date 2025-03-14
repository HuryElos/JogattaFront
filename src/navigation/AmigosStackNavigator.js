// src/navigation/AmigosStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AdicionarAmigos from '../screens/AdicionarAmigos';
import ConvidarAmigos from '../screens/ConvidarAmigos';
import ListarAmigos from '../screens/ListarAmigos';

const Stack = createStackNavigator();

export default function AmigosStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="ListarAmigos">
      <Stack.Screen
        name="ListarAmigos"
        component={ListarAmigos}
        options={{ title: 'Amigos' }}
      />
      <Stack.Screen
        name="AdicionarAmigos"
        component={AdicionarAmigos}
        options={{ title: 'Adicionar Amigos' }}
      />
      <Stack.Screen
        name="ConvidarAmigos"
        component={ConvidarAmigos}
        options={{ title: 'Convidar Amigos' }}
      />
    </Stack.Navigator>
  );
}

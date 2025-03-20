// src/navigation/PartidasStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Telas
import PartidasScreen from '../screens/PartidasScreen';
import LiveRoomScreen from '../features/jogos/screens/LiveRoomScreen';
import JogosStackNavigator from './JogosStackNavigator';

const Stack = createStackNavigator();

export default function PartidasStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PartidasList"
        component={PartidasScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LiveRoom"
        component={LiveRoomScreen}
        options={{ title: 'Sala ao Vivo' }}
      />
      <Stack.Screen
        name="JogosFlow"
        component={JogosStackNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
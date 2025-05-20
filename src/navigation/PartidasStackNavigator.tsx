// src/navigation/PartidasStackNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Telas
import PartidasScreen from '../screens/PartidasScreen';
import LiveRoomScreen from '../features/jogos/screens/LiveRoomScreen';
import JogosStackNavigator from './JogosStackNavigator';

export type RootStackParamList = {
  PartidasList: undefined;
  LiveRoom: { id_jogo: number };
  JogosFlow: { screen: string };
};

const Stack = createStackNavigator<RootStackParamList>();

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
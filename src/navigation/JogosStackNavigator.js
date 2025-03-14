// src/navigation/JogosStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Telas do fluxo de jogos
import CriarJogo from '../features/jogos/screens/CriarJogo';
import EquilibrarTimesScreen from '../features/jogos/screens/EquilibrarTimesScreen';
import ConvidarAmigos from '../features/amigos/screens/ConvidarAmigos';
import JogoScreen from '../features/jogos/screens/JogoScreen';
import TimesBalanceados from '../features/jogos/screens/TimesBalanceados';
import LiveRoomScreen from '../features/jogos/screens/LiveRoomScreen';
import ManualJogoScreen from '../features/jogos/screens/ManualJogoScreen';
import ManualDistributionScreen from '../features/jogos/screens/ManualDistributionScreen';

// IMPORTE A NOVA TELA:
import DefineTeamSizeScreen from '../features/jogos/screens/DefineTeamSizeScreen';

const Stack = createStackNavigator();

export default function JogosStackNavigator() {
  return (
    <Stack.Navigator>
      {/* Tela principal de Equilibrar Times */}
      <Stack.Screen
        name="EquilibrarTimesScreen"
        component={EquilibrarTimesScreen}
        options={{ headerShown: false }}
      />

      {/* Criação de jogo */}
      <Stack.Screen
        name="CriarJogo"
        component={CriarJogo}
        options={{ title: 'Criar Jogo' }}
      />

      {/* Convidar amigos */}
      <Stack.Screen
        name="ConvidarAmigos"
        component={ConvidarAmigos}
        options={{ title: 'Convidar Amigos' }}
      />

      {/* Tela de exibição do jogo */}
      <Stack.Screen
        name="JogoScreen"
        component={JogoScreen}
        options={{ title: 'Jogo' }}
      />

      {/* Tela de times balanceados automaticamente */}
      <Stack.Screen
        name="TimesBalanceados"
        component={TimesBalanceados}
        options={{ title: 'Times Balanceados' }}
      />

      {/* Sala ao vivo */}
      <Stack.Screen
        name="LiveRoom"
        component={LiveRoomScreen}
        options={{ title: 'Live Room' }}
      />

      {/* NOVA TELA PARA DEFINIR TAMANHO DO TIME */}
      <Stack.Screen
        name="DefineTeamSizeScreen"
        component={DefineTeamSizeScreen}
        options={{ title: 'Definir Tamanho' }}
      />

      {/* Telas para fluxo manual */}
      <Stack.Screen
        name="ManualJogoScreen"
        component={ManualJogoScreen}
        options={{ title: 'Distribuir Manualmente' }}
      />
      <Stack.Screen
        name="ManualDistributionScreen"
        component={ManualDistributionScreen}
        options={{ title: 'Organizar Times Manualmente' }}
      />
    </Stack.Navigator>
  );
}

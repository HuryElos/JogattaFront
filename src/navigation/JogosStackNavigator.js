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
import DefineTeamSizeScreen from '../features/jogos/screens/DefineTeamSizeScreen';

// ➕ Importa a tela de pagamento
import PagamentoScreen from '../features/jogos/screens/PagamentoScreen';
import GameInviteScreen from '../features/jogos/screens/GameInviteScreen';

const Stack = createStackNavigator();

export default function JogosStackNavigator() {
  return (
    <Stack.Navigator>

      {/* Tela principal de Equilibrar Times */}
      <Stack.Screen
        name="EquilibrarTimesScreen"
        component={EquilibrarTimesScreen}
        options={{ title: 'Equilibrar Times' }}
      />

      {/* Tela de Jogo (fluxo automático) */}
      <Stack.Screen
        name="JogoScreen"
        component={JogoScreen}
        options={{ title: 'Jogo' }}
      />

      {/* Tela de Distribuição Manual */}
      <Stack.Screen
        name="ManualDistributionScreen"
        component={ManualDistributionScreen}
        options={{ title: 'Organizar Times Manualmente' }}
      />

      {/* Tela de times balanceados */}
      <Stack.Screen
        name="TimesBalanceados"
        component={TimesBalanceados}
        options={{ title: 'Times Balanceados' }}
      />

      {/* Sala ao vivo */}
      <Stack.Screen
        name="LiveRoom"
        component={LiveRoomScreen}
        options={{ title: 'Sala ao Vivo' }}
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

      {/* Tela para definir tamanho do time */}
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

      {/* ➕ Tela de Pagamento */}
      <Stack.Screen
        name="Pagamento"
        component={PagamentoScreen}
        options={{ title: 'Pagamento' }}
      />

      {/* ➕ Tela de Convite de Jogo */}
      <Stack.Screen
        name="GameInvite"
        component={GameInviteScreen}
        options={{ title: 'Convite de Jogo' }}
      />

    </Stack.Navigator>
  );
}

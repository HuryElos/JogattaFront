// src/navigation/RootNavigator.js

import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthContext from '../contexts/AuthContext';

// Nossos stacks
import AuthStackNavigator from './AuthStackNavigator';
import AdminStackNavigator from './AdminStackNavigator';
import AppNavigator from './AppNavigator';

// Outras telas que ficam "fora" (podem ser acessadas de qualquer stack).
import InviteHandlerScreen from '../screens/InviteHandlerScreen';
import ViewProfileScreen from '../features/perfil/screens/ViewProfileScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Se não há user logado, mostra o fluxo de Autenticação
        <Stack.Screen
          name="AuthStack"
          component={AuthStackNavigator}
        />
      ) : isSuperAdmin ? (
        // Se o user está logado E é superadmin, mostra AdminStack
        <Stack.Screen
          name="AdminStack"
          component={AdminStackNavigator}
        />
      ) : (
        // Senão, mostra o AppNavigator (usuário comum)
        <Stack.Screen
          name="MainApp"
          component={AppNavigator}
        />
      )}

      {/* Exemplo de telas extras que podem aparecer de qualquer lugar */}
      <Stack.Screen
        name="InviteHandler"
        component={InviteHandlerScreen}
        options={{ headerShown: true, title: 'Gerenciar Convite' }}
      />
      <Stack.Screen
        name="ViewProfile"
        component={ViewProfileScreen}
        options={{ headerShown: true, title: 'Perfil' }}
      />
    </Stack.Navigator>
  );
}

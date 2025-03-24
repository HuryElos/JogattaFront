import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminHomeScreen from '../features/admin/screens/AdminHomeScreen';
import CreateCompanyScreen from '../features/admin/screens/CreateCompanyScreen';
import ManageCompanyScreen from '../features/admin/screens/ManageCompanyScreen';
import CreateQuadraScreen from '../features/admin/screens/CriarQuadraScreen';
import GerenciarQuadraScreen from '../features/quadras/screens/GerenciarQuadraScreen';

const Stack = createStackNavigator();

export default function GestorStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="ManageCompany">
      <Stack.Screen
        name="GestorHome"
        component={AdminHomeScreen}
        options={{ title: 'Suas Quadras' }}
      />
      <Stack.Screen
        name="CreateCompany"
        component={CreateCompanyScreen}
        options={{ title: 'Cadastrar Empresa' }}
      />
      <Stack.Screen
        name="ManageCompany"
        component={ManageCompanyScreen}
        options={{ title: 'Gerenciar Empresa' }}
      />
      <Stack.Screen
        name="CreateQuadra"
        component={CreateQuadraScreen}
        options={{ title: 'Cadastrar Quadra' }}
      />
      <Stack.Screen
        name="GerenciarQuadra"
        component={GerenciarQuadraScreen}
        options={{ title: 'Gerenciar Quadra' }}
      />
    </Stack.Navigator>
  );
}

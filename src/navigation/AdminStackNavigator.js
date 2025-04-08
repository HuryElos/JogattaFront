import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminHomeScreen from '../features/admin/screens/AdminHomeScreen';
import CreateCompanyScreen from '../features/admin/screens/CreateCompanyScreen';
import ManageCompanyScreen from '../features/admin/screens/ManageCompanyScreen';
import CreateQuadraScreen from '../features/admin/screens/CriarQuadraScreen';
import GerenciarQuadraScreen from '../features/quadras/screens/GerenciarQuadraScreen';
import AdminCompanyDetailsScreen from '../features/admin/screens/AdminCompanyDetailsScreen'; // ✅ Novo import

const Stack = createStackNavigator();

export default function AdminStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Admin - Empresas' }}
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
      <Stack.Screen
        name="AdminCompanyDetails" // ✅ Tela de detalhes da empresa
        component={AdminCompanyDetailsScreen}
        options={{ title: 'Detalhes da Empresa' }}
      />
    </Stack.Navigator>
  );
}

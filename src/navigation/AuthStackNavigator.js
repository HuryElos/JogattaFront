// src/navigation/AuthStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Telas de autenticação
import Steps from '../features/auth/screens/Steps';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';

const Stack = createStackNavigator();

export default function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Steps" component={Steps} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

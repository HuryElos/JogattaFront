// src/screens/InviteHandlerScreen.js

import React, { useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AuthContext from '../contexts/AuthContext';
import jwtDecode from 'jwt-decode';

const InviteHandlerScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const uuid = route.params?.uuid;

  useEffect(() => {
    const processInvite = async () => {
      // Se não tem UUID, simplesmente redireciona.
      if (!uuid) {
        return redirectToHome();
      }

      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          Alert.alert('Sessão requerida', 'Por favor, faça login para acessar o convite.');
          return redirectToLogin();
        }

        const decodedToken = jwtDecode(token);

        if (decodedToken.exp * 1000 < Date.now()) {
          Alert.alert('Sessão expirada', 'Sua sessão expirou. Por favor, faça login novamente.');
          await AsyncStorage.removeItem('token');
          return redirectToLogin();
        }

        const response = await api.get(`/api/convites/${uuid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 && response.data.convite) {
          const { id_jogo } = response.data.convite;
          console.log('Convite válido. Redirecionando para a sala...');

          return navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'AppStack',
                  state: {
                    routes: [
                      {
                        name: 'HomeTab',
                        state: {
                          routes: [{ name: 'LiveRoom', params: { id_jogo } }],
                        },
                      },
                    ],
                  },
                },
              ],
            })
          );
        }

        throw new Error('Convite inválido.');
      } catch (error) {
        console.error('Erro ao processar o convite:', error.response?.data || error.message);

        if (error.response?.status === 404) {
          Alert.alert('Convite inválido', 'O convite fornecido é inválido ou expirado.');
        } else {
          Alert.alert('Erro', 'Não foi possível processar o convite. Tente novamente mais tarde.');
        }

        redirectToHome();
      }
    };

    const redirectToHome = () => {
      if (user) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'AppStack',
                state: {
                  routes: [
                    {
                      name: 'HomeTab',
                      state: { routes: [{ name: 'Home' }] },
                    },
                  ],
                },
              },
            ],
          })
        );
      } else {
        redirectToLogin();
      }
    };

    const redirectToLogin = () => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'AuthStack',
              state: {
                routes: [{ name: 'Login' }],
              },
            },
          ],
        })
      );
    };

    processInvite();
  }, [uuid, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text>Validando convite...</Text>
    </View>
  );
};

export default InviteHandlerScreen;

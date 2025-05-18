import React, { useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation, CommonActions, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AuthContext from '../contexts/AuthContext';
import jwtDecode from 'jwt-decode';

interface User {
  id: number;
  nome: string;
  // Adicione outros campos do usuário conforme necessário
}

interface AuthContextType {
  user: User | null;
  // Adicione outros campos do contexto conforme necessário
}

interface DecodedToken {
  exp: number;
  id: number;
  // Adicione outros campos do token conforme necessário
}

interface Convite {
  id_jogo: number;
  // Adicione outros campos do convite conforme necessário
}

type RootStackParamList = {
  InviteHandler: { uuid?: string };
  AppStack: undefined;
  AuthStack: undefined;
  HomeTab: undefined;
  LiveRoom: { id_jogo: number };
  Home: undefined;
  Login: undefined;
};

type InviteHandlerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InviteHandler'>;
type InviteHandlerScreenRouteProp = RouteProp<RootStackParamList, 'InviteHandler'>;

const InviteHandlerScreen: React.FC = () => {
  const route = useRoute<InviteHandlerScreenRouteProp>();
  const navigation = useNavigation<InviteHandlerScreenNavigationProp>();
  const { user } = useContext(AuthContext as React.Context<AuthContextType>);

  const uuid = route.params?.uuid;

  useEffect(() => {
    const processInvite = async (): Promise<void> => {
      if (!uuid) {
        return redirectToHome();
      }

      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          Alert.alert('Sessão requerida', 'Por favor, faça login para acessar o convite.');
          return redirectToLogin();
        }

        const decodedToken = jwtDecode<DecodedToken>(token);

        if (decodedToken.exp * 1000 < Date.now()) {
          Alert.alert('Sessão expirada', 'Sua sessão expirou. Por favor, faça login novamente.');
          await AsyncStorage.removeItem('token');
          return redirectToLogin();
        }

        const response = await api.get<{ convite: Convite }>(`/api/convites/${uuid}`, {
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
      } catch (error: any) {
        console.error('Erro ao processar o convite:', error.response?.data || error.message);

        if (error.response?.status === 404) {
          Alert.alert('Convite inválido', 'O convite fornecido é inválido ou expirado.');
        } else {
          Alert.alert('Erro', 'Não foi possível processar o convite. Tente novamente mais tarde.');
        }

        redirectToHome();
      }
    };

    const redirectToHome = (): void => {
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

    const redirectToLogin = (): void => {
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
  }, [uuid, user, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.text}>Validando convite...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default InviteHandlerScreen; 
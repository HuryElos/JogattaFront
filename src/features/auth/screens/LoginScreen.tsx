import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Image,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AuthContext from '../../../contexts/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CONFIG from '../../../config/config';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  LoginScreen: { initialRole?: UserRole };
  MainApp: undefined;
  GestorStack: undefined;
  Register: { initialRole?: UserRole };
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LoginScreen'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'LoginScreen'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
}

type UserRole = 'player' | 'courtOwner';

interface User {
  role?: string;
  mappedRole?: UserRole;
  papel_usuario?: string;
}

interface AuthContextType {
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  user: User | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const initialUserRole = route.params?.initialRole || 'player';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>(initialUserRole);
  const { login: loginContext, user } = useContext(AuthContext as React.Context<AuthContextType>);

  // Configura autenticação com Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'SEU_EXPO_CLIENT_ID',
    iosClientId: 'SEU_IOS_CLIENT_ID',
    androidClientId: 'SEU_ANDROID_CLIENT_ID',
    webClientId: 'SEU_WEB_CLIENT_ID',
  });

  useEffect(() => {
    if (route.params?.initialRole) {
      setUserRole(route.params.initialRole);
    }
  }, [route.params]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication?.accessToken);
    }
  }, [response]);

  const navigateBasedOnRole = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const userDataObj: User | null = userData ? JSON.parse(userData) : null;
      const storedRole = await AsyncStorage.getItem('userRole') as UserRole | null;

      console.log('[LoginScreen] Navegando com base no papel:', {
        contextRole: user?.role,
        contextMappedRole: user?.mappedRole,
        storedRole,
        userData: userDataObj?.papel_usuario
      });

      const userPapel = user?.role || userDataObj?.papel_usuario;
      const mappedRole = user?.mappedRole || storedRole || 'player';

      if (userPapel === 'gestor' || mappedRole === 'courtOwner') {
        console.log('[LoginScreen] -> GestorStack');
        navigation.reset({
          index: 0,
          routes: [{ name: 'GestorStack' }],
        });
      } else if (mappedRole === 'player') {
        console.log('[LoginScreen] -> MainApp (player)');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      } else {
        console.log('[LoginScreen] -> MainApp (fallback)');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    } catch (error) {
      console.error('[LoginScreen] Erro ao navegar baseado no papel:', error);
      navigation.navigate('MainApp');
    }
  };

  const handleGoogleLogin = async (token: string | undefined): Promise<void> => {
    if (!token) {
      Alert.alert('Erro', 'Token de autenticação não encontrado.');
      return;
    }

    try {
      const res = await fetch(`${CONFIG.BASE_URL}/api/auth/google/callback`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userRole', userRole);
        navigateBasedOnRole();
      } else {
        Alert.alert('Erro', 'Não foi possível autenticar com Google.');
      }
    } catch (error) {
      console.error('[LoginScreen] Erro ao autenticar com Google:', error);
      Alert.alert('Erro', 'Ocorreu um erro durante a autenticação com Google.');
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const success = await loginContext(email, password, userRole);

      if (success) {
        console.log('[LoginScreen] Login bem-sucedido. Redirecionando...');
        setTimeout(() => {
          navigateBasedOnRole();
        }, 300);
      } else {
        Alert.alert('Erro de Login', 'Usuário ou senha inválidos.');
      }
    } catch (error) {
      console.error('[LoginScreen] Erro ao realizar login:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao realizar login. Tente novamente.');
    }
  };

  const toggleUserRole = (): void => {
    const newRole: UserRole = userRole === 'player' ? 'courtOwner' : 'player';
    setUserRole(newRole);
    setEmail('');
    setPassword('');
  };

  const PlayerHeader: React.FC = () => (
    <View style={playerStyles.header}>
      <LinearGradient
        colors={['#4D9FEC', '#66B0F2', '#80C0F7']}
        style={playerStyles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image style={playerStyles.ballIcon} resizeMode="contain" />
        <Text style={playerStyles.title}>Bem-vindo de volta!</Text>
        <Text style={playerStyles.subtitle}>Pronto para organizar seu próximo jogo?</Text>
      </LinearGradient>
    </View>
  );

  const PlayerLoginButton: React.FC = () => (
    <TouchableOpacity
      style={playerStyles.loginButtonContainer}
      onPress={handleLogin}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#FF7014', '#FF8A3D', '#FF7014']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={playerStyles.loginButton}
      >
        <Ionicons name="football-outline" size={22} color="#FFF" style={playerStyles.buttonIcon} />
        <Text style={playerStyles.loginButtonText}>Entrar como Jogador</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const CourtOwnerHeader: React.FC = () => (
    <View style={courtOwnerStyles.header}>
      <LinearGradient
        colors={['#FF7014', '#FF8A3D', '#FF7014']}
        style={courtOwnerStyles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image style={courtOwnerStyles.courtIcon} resizeMode="contain" />
        <Text style={courtOwnerStyles.title}>Área do Gestor</Text>
        <Text style={courtOwnerStyles.subtitle}>Gerencie suas quadras e horários</Text>
      </LinearGradient>
    </View>
  );

  const CourtOwnerLoginButton: React.FC = () => (
    <TouchableOpacity
      style={courtOwnerStyles.loginButtonContainer}
      onPress={handleLogin}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#4D9FEC', '#66B0F2', '#80C0F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={courtOwnerStyles.loginButton}
      >
        <Ionicons name="business-outline" size={22} color="#FFF" style={courtOwnerStyles.buttonIcon} />
        <Text style={courtOwnerStyles.loginButtonText}>Entrar como Gestor</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {userRole === 'player' ? <PlayerHeader /> : <CourtOwnerHeader />}
          
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              >
                <Ionicons
                  name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {userRole === 'player' ? <PlayerLoginButton /> : <CourtOwnerLoginButton />}

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleUserRole}
            >
              <Text style={styles.toggleButtonText}>
                {userRole === 'player'
                  ? 'Sou gestor de quadra'
                  : 'Sou jogador'}
              </Text>
            </TouchableOpacity>
          </View>


            <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>Não tem uma conta? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register', { initialRole: userRole })}
                  >
                    <Text
                      style={[
                        styles.registerLink,
                        userRole === 'courtOwner' && courtOwnerStyles.registerLink
                      ]}
                    >
                      Cadastre-se
                    </Text>
                  </TouchableOpacity>
                </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
  },
  toggleButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#666',
    fontSize: 16,
  },
    registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  registerText: { color: '#777', fontSize: 14 },
  registerLink: { color: '#37A0EC', fontSize: 14, fontWeight: '600' },
  switchRoleButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 5,
  },
});

const playerStyles = StyleSheet.create({
  header: {
    height: height * 0.3,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ballIcon: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  loginButtonContainer: {
    marginTop: 20,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const courtOwnerStyles = StyleSheet.create({
  header: {
    height: height * 0.3,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  courtIcon: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  loginButtonContainer: {
    marginTop: 20,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    color: '#FF7014',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen; 
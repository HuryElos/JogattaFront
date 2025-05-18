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

const PlayerHeader: React.FC = () => (
  <View style={playerStyles.header}>
    <LinearGradient
      colors={['#37A0EC', '#66B0F2', '#80C0F7']}
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {userRole === 'player' ? <PlayerHeader /> : <CourtOwnerHeader />}
        <View
          style={[
            styles.formContainer,
            userRole === 'courtOwner' && courtOwnerStyles.formContainer
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.inputGroup}>
              <Text style={userRole === 'player' ? playerStyles.inputLabel : courtOwnerStyles.inputLabel}>
                E-mail
              </Text>
              <View style={userRole === 'player' ? playerStyles.inputWrapper : courtOwnerStyles.inputWrapper}>
                <Ionicons 
                  name="mail-outline" 
                  size={22} 
                  color={userRole === 'player' ? '#37A0EC' : '#FF7014'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={userRole === 'player' ? playerStyles.inputLabel : courtOwnerStyles.inputLabel}>
                Senha
              </Text>
              <View style={userRole === 'player' ? playerStyles.inputWrapper : courtOwnerStyles.inputWrapper}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={22} 
                  color={userRole === 'player' ? '#37A0EC' : '#FF7014'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  style={styles.toggleButton}
                >
                  <Ionicons
                    name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={userRole === 'player' ? '#37A0EC' : '#FF7014'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                userRole === 'player' ? playerStyles.loginButtonContainer : courtOwnerStyles.loginButtonContainer,
                { marginTop: 20 }
              ]}
              onPress={handleLogin}
            >
              <LinearGradient
                colors={userRole === 'player' ? ['#37A0EC', '#66B0F2', '#80C0F7'] : ['#FF7014', '#FF8A3D', '#FF7014']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={userRole === 'player' ? playerStyles.loginButton : courtOwnerStyles.loginButton}
              >
                <Ionicons 
                  name={userRole === 'player' ? 'football-outline' : 'business-outline'} 
                  size={24} 
                  color="#FFF" 
                  style={{ marginRight: 10 }} 
                />
                <Text style={userRole === 'player' ? playerStyles.loginButtonText : courtOwnerStyles.loginButtonText}>
                  {userRole === 'player' ? 'Entrar como Jogador' : 'Entrar como Gestor'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register', { initialRole: userRole })}>
                <Text style={userRole === 'player' ? playerStyles.registerLink : courtOwnerStyles.registerLink}>
                  Cadastre-se
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.switchRoleButton} onPress={toggleUserRole}>
              <Text style={userRole === 'player' ? playerStyles.switchRoleText : courtOwnerStyles.switchRoleText}>
                {userRole === 'player' ? 'Entrar como Gestor' : 'Entrar como Jogador'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  safeArea: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -80,
  },
  scrollContent: {
    padding: 25,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#333',
    fontSize: 16,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  registerText: {
    color: '#777',
    fontSize: 15,
  },
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
  inputLabel: {
    fontSize: 16,
    color: '#37A0EC',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 8,
    backgroundColor: '#FFF',
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
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    color: '#37A0EC',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRoleText: {
    color: '#37A0EC',
    fontSize: 14,
    fontWeight: '500',
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
  formContainer: {
    backgroundColor: '#FFF',
  },
  inputLabel: {
    fontSize: 16,
    color: '#FF7014',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0CC',
    borderRadius: 8,
    backgroundColor: '#FFF',
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
  switchRoleText: {
    color: '#FF7014',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen; 
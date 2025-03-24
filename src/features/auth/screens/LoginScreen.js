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
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../../../contexts/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CONFIG from '../../../config/config';  // Importa seu config

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation, route }) => {
  const initialUserRole = route.params?.initialRole || 'player';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [userRole, setUserRole] = useState(initialUserRole);
  const { login: loginContext } = useContext(AuthContext);

  // Configura autenticação com Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'SEU_EXPO_CLIENT_ID',
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
      handleGoogleLogin(authentication.accessToken);
    }
  }, [response]);

  const handleGoogleLogin = async (token) => {
    try {
      // Usa o BASE_URL do config
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
        navigation.navigate(userRole === 'player' ? 'PlayerDashboard' : 'CourtOwnerDashboard');
      } else {
        Alert.alert('Erro', 'Não foi possível autenticar com Google.');
      }
    } catch (error) {
      console.error('Erro ao autenticar com Google:', error);
      Alert.alert('Erro', 'Ocorreu um erro durante a autenticação com Google.');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const success = await loginContext(email, password, userRole);
      if (success) {
        await AsyncStorage.setItem('userRole', userRole);
        navigation.navigate(userRole === 'player' ? 'PlayerDashboard' : 'CourtOwnerDashboard');
      } else {
        Alert.alert('Erro de Login', 'Usuário ou senha inválidos.');
      }
    } catch (error) {
      console.error('Erro ao realizar login:', error.message || error);
      Alert.alert('Erro', 'Ocorreu um erro ao realizar login. Tente novamente.');
    }
  };

  const toggleUserRole = () => {
    const newRole = userRole === 'player' ? 'courtOwner' : 'player';
    setUserRole(newRole);
    setEmail('');
    setPassword('');
  };

  const PlayerHeader = () => (
    <View style={playerStyles.header}>
      <LinearGradient
        colors={['#4D9FEC', '#66B0F2', '#80C0F7']}
        style={playerStyles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image 
          style={playerStyles.ballIcon}
          resizeMode="contain"
        />
        <Text style={playerStyles.title}>Bem-vindo de volta!</Text>
        <Text style={playerStyles.subtitle}>Pronto para organizar seu próximo jogo?</Text>
      </LinearGradient>
    </View>
  );

  const PlayerLoginButton = () => (
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

  const CourtOwnerHeader = () => (
    <View style={courtOwnerStyles.header}>
      <LinearGradient
        colors={['#4E5A6D', '#5D6B84', '#3B4455']}
        style={courtOwnerStyles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={courtOwnerStyles.logoContainer}>
          <Ionicons name="calendar-outline" size={36} color="#FF7014" />
        </View>
        <Text style={courtOwnerStyles.title}>Jogatta Gestor</Text>
        <Text style={courtOwnerStyles.subtitle}>Gerencie suas quadras</Text>
      </LinearGradient>
    </View>
  );

  const CourtOwnerLoginButton = () => (
    <TouchableOpacity 
      style={courtOwnerStyles.loginButtonContainer} 
      onPress={handleLogin}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#4E5A6D', '#5D6B84', '#3B4455']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={courtOwnerStyles.loginButton}
      >
        <Ionicons name="key-outline" size={20} color="#FF7014" style={courtOwnerStyles.buttonIcon} />
        <Text style={courtOwnerStyles.loginButtonText}>Acessar Gestor</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {userRole === 'player' ? <PlayerHeader /> : <CourtOwnerHeader />}
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.formContainer}>
            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={[
                  styles.inputLabel,
                  userRole === 'courtOwner' && courtOwnerStyles.inputLabel
                ]}>
                  E-mail
                </Text>
                <View style={[
                  styles.inputWrapper,
                  userRole === 'courtOwner' && courtOwnerStyles.inputWrapper
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={userRole === 'player' ? "#37A0EC" : "#2F5BA7"} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Digite seu e-mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[
                  styles.inputLabel,
                  userRole === 'courtOwner' && courtOwnerStyles.inputLabel
                ]}>
                  Senha
                </Text>
                <View style={[
                  styles.inputWrapper,
                  userRole === 'courtOwner' && courtOwnerStyles.inputWrapper
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={userRole === 'player' ? "#37A0EC" : "#2F5BA7"} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Digite sua senha"
                    secureTextEntry={secureTextEntry}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity 
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} 
                      size={22} 
                      color={userRole === 'player' ? "#37A0EC" : "#2F5BA7"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[
                  styles.forgotPasswordText,
                  userRole === 'courtOwner' && courtOwnerStyles.forgotPasswordText
                ]}>
                  Esqueceu a senha?
                </Text>
              </TouchableOpacity>
              
              {userRole === 'player' ? <PlayerLoginButton /> : <CourtOwnerLoginButton />}
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.googleButton,
                  userRole === 'courtOwner' && courtOwnerStyles.googleButton
                ]} 
                onPress={() => promptAsync()}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.googleButtonText,
                  userRole === 'courtOwner' && courtOwnerStyles.googleButtonText
                ]}>
                  <Text style={{color: '#EA4335'}}>G</Text> Continuar com Google
                </Text>
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Não tem uma conta? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register', { initialRole: userRole })}>
                  <Text style={[
                    styles.registerLink,
                    userRole === 'courtOwner' && courtOwnerStyles.registerLink
                  ]}>
                    Cadastre-se
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.switchRoleButton}
                onPress={toggleUserRole}
              >
                <Text style={[
                  styles.switchRoleText,
                  userRole === 'courtOwner' && courtOwnerStyles.switchRoleText
                ]}>
                  {userRole === 'player' 
                    ? 'Acesso para Donos de Quadra' 
                    : 'Acesso para Jogadores'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;

/* ===== Estilos Compartilhados ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  formContent: { padding: 24, paddingTop: 40 },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    height: 55,
  },
  inputIcon: { paddingHorizontal: 12 },
  input: { flex: 1, height: 55, fontSize: 16, color: '#333' },
  eyeIcon: { paddingHorizontal: 12 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 6, marginBottom: 20 },
  forgotPasswordText: { color: '#37A0EC', fontSize: 14, fontWeight: '500' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { paddingHorizontal: 15, color: '#888', fontSize: 14 },
  googleButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  googleButtonText: { color: '#555', fontSize: 16, fontWeight: '500' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  registerText: { color: '#777', fontSize: 14 },
  registerLink: { color: '#37A0EC', fontSize: 14, fontWeight: '600' },
  switchRoleButton: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0', marginTop: 5 },
  switchRoleText: { color: '#37A0EC', fontSize: 15, fontWeight: '500' }
});

/* ===== Estilos Específicos para Jogador ===== */
const playerStyles = StyleSheet.create({
  header: { height: 220 },
  headerGradient: {
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    alignItems: 'center',
  },
  ballIcon: { width: 50, height: 50, marginBottom: 10 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  loginButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 5,
    elevation: 3,
    shadowColor: '#FF7014',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButton: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: { marginRight: 8 },
  loginButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    paddingLeft: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E9F0',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  infoText: { fontSize: 12, color: '#777', marginTop: 5, paddingLeft: 5 },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#FF7014',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonGradient: {
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: { color: '#37A0EC', fontSize: 15, fontWeight: '600' },
  switchRoleText: { color: '#37A0EC', fontSize: 15, fontWeight: '500' },
});

/* ===== Estilos Específicos para Dono de Quadra (Gestor) ===== */
const courtOwnerStyles = StyleSheet.create({
  header: { height: 200 },
  headerGradient: {
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  loginButtonContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
    elevation: 3,
    shadowColor: '#FF7014',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 10,
  },
  buttonIcon: { marginRight: 10 },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputLabel: { color: '#4A5871', fontWeight: '600' },
  inputWrapper: { borderColor: '#DDE1E6', backgroundColor: '#F7F9FC' },
  forgotPasswordText: { color: '#FF7014' },
  googleButton: { borderColor: '#DDE1E6' },
  googleButtonText: { color: '#444' },
  registerLink: { color: '#FF7014' },
  switchRoleText: { color: '#FF7014' },
});

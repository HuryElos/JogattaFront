// src/features/auth/screens/LoginScreen.js
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
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../../../contexts/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login: loginContext } = useContext(AuthContext);

  // Configura autenticação com Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'SEU_EXPO_CLIENT_ID',
    iosClientId: 'SEU_IOS_CLIENT_ID',
    androidClientId: 'SEU_ANDROID_CLIENT_ID',
    webClientId: 'SEU_WEB_CLIENT_ID',
  });

  // Trata a resposta da autenticação do Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.accessToken);
    }
  }, [response]);

  const handleGoogleLogin = async (token) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/google/callback', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        navigation.navigate('HomeScreen');
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
      const success = await loginContext(email, password);
      if (success) {
        navigation.navigate('MainApp');
      } else {
        Alert.alert('Erro de Login', 'Usuário ou senha inválidos.');
      }
    } catch (error) {
      console.error('Erro ao realizar login:', error.message || error);
      Alert.alert('Erro', 'Ocorreu um erro ao realizar login. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background com gradiente */}
      <LinearGradient
        colors={['#1A91DA', '#37A0EC', '#59B0FA']}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.title}>Bem-vindo de volta!</Text>
            <Text style={styles.subtitle}>Entre para continuar jogando</Text>
          </View>
          
          {/* Container do formulário que preenche toda a parte inferior */}
          <View style={styles.formContainer}>
            <View style={styles.formContent}>
              {/* E-mail */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-mail</Text>
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
              
              {/* Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
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
                      color="#AAAAAA" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginButtonContainer} 
                onPress={handleLogin}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FF7014', '#FF8A3D', '#FF7014']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>Entrar</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity 
                style={styles.googleButton} 
                onPress={() => promptAsync()}
                activeOpacity={0.7}
              >
                <Text style={styles.googleButtonText}>
                  <Text style={{color: '#EA4335'}}>G</Text> Continuar com Google
                </Text>
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Não tem uma conta? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Cadastre-se</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formContent: {
    padding: 24,
    paddingTop: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    height: 50,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 15,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#37A0EC',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loginButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 15,
    color: '#888',
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  googleButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#777',
    fontSize: 14,
  },
  registerLink: {
    color: '#37A0EC',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
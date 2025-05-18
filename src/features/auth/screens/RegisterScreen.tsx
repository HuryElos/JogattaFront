import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { register, registerCourtOwner } from '../../../features/auth/services/authService';
import AuthContext from '../../../contexts/AuthContext';
import CompanyContext from '../../../contexts/CompanyContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Interfaces
interface AuthContextType {
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
}

interface CompanyContextType {
  setCompany: (company: Company) => void;
}

interface RegisterScreenProps {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, any>;
}

interface RegisterResponse {
  token: string;
  empresa?: Company;
}

interface Company {
  id: string;
  name: string;
  // Adicione outros campos necessários da empresa
}

interface RegisterPlayerParams {
  name: string;
  email: string;
  password: string;
  tt: string;
  altura: string;
  role: 'player';
  termsAccepted?: boolean;
}

interface RegisterCourtOwnerParams {
  companyName: string;
  email: string;
  password: string;
  cnpj: string;
  phone: string;
  address: string;
}

interface Styles {
  container: ViewStyle;
  safeArea: ViewStyle;
  backButton: ViewStyle;
  formContainer: ViewStyle;
  scrollContent: ViewStyle;
  inputGroup: ViewStyle;
  inputIcon: TextStyle;
  loginContainer: ViewStyle;
  loginText: TextStyle;
  switchRoleButton: ViewStyle;
  buttonIcon: TextStyle;
  toggleButton: ViewStyle;
  input: TextStyle;
}

interface PlayerStyles {
  headerGradient: ViewStyle;
  headerContent: ViewStyle;
  iconContainer: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  inputLabel: TextStyle;
  inputWrapper: ViewStyle;
  infoText: TextStyle;
  registerButton: ViewStyle;
  registerButtonGradient: ViewStyle;
  registerButtonText: TextStyle;
  loginLink: TextStyle;
  switchRoleText: TextStyle;
  loginButtonContainer: ViewStyle;
  loginButton: ViewStyle;
  buttonIcon: TextStyle;
  loginButtonText: TextStyle;
  termsContainer: ViewStyle;
  checkbox: ViewStyle;
  termsText: TextStyle;
  termsLink: TextStyle;
}

interface CourtOwnerStyles {
  headerGradient: ViewStyle;
  headerContent: ViewStyle;
  iconContainer: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  loginButtonContainer: ViewStyle;
  loginButton: ViewStyle;
  buttonIcon: TextStyle;
  loginButtonText: TextStyle;
  inputLabel: TextStyle;
  inputWrapper: ViewStyle;
  termsContainer: ViewStyle;
  checkbox: ViewStyle;
  termsText: TextStyle;
  termsLink: TextStyle;
  registerButton: ViewStyle;
  disabledButton: ViewStyle;
  registerButtonText: TextStyle;
  loginLink: TextStyle;
  switchRoleText: TextStyle;
  formContainer: ViewStyle;
}

type UserRole = 'player' | 'courtOwner';

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation, route }) => {
  const initialRole = route.params?.initialRole || 'player';

  // Estados para jogador
  const [userRole, setUserRole] = useState<UserRole>(initialRole as UserRole);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [tt, setTt] = useState<string>('');
  const [altura, setAltura] = useState<string>('');

  // Estados para dono de quadra (Gestor)
  const [companyName, setCompanyName] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // Estado para exibir/ocultar senha
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);

  // Adicione esta função após as outras declarações de estado
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Adicione o estado para termos do jogador após os outros estados
  const [playerTermsAccepted, setPlayerTermsAccepted] = useState<boolean>(false);

  // Contextos
  const { login: loginContext } = useContext<AuthContextType>(AuthContext);
  const { setCompany } = useContext<CompanyContextType>(CompanyContext);

  useEffect(() => {
    if (route.params?.initialRole) {
      setUserRole(route.params.initialRole as UserRole);
    }
  }, [route.params]);

  // Adicione esta função antes do return
  const checkPasswordStrength = (pass: string) => {
    if (!pass) {
      setPasswordStrength(null);
      return;
    }
    
    const hasNumber = /\d/.test(pass);
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= 8;

    const strength = 
      (hasNumber ? 1 : 0) +
      (hasUpperCase ? 1 : 0) +
      (hasLowerCase ? 1 : 0) +
      (hasSpecialChar ? 1 : 0) +
      (isLongEnough ? 1 : 0);

    if (strength >= 4) {
      setPasswordStrength('strong');
    } else if (strength >= 2) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  };

  // Adicione esta função após as outras funções de validação
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 3; // Nome deve ter pelo menos 3 caracteres
  };

  const validateTT = (tt: string): boolean => {
    return tt.trim().length >= 3; // TT deve ter pelo menos 3 caracteres
  };

  // Função principal de cadastro
  const handleRegister = async (): Promise<void> => {
    console.log('[RegisterScreen] handleRegister iniciado. userRole:', userRole);

    if (userRole === 'player') {
      // Validações melhoradas
      if (!name || !email || !password || !tt || !altura) {
        Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
        return;
      }

      if (!validateName(name)) {
        Alert.alert('Nome Inválido', 'O nome deve ter pelo menos 3 caracteres.');
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert('E-mail Inválido', 'Por favor, insira um e-mail válido.');
        return;
      }

      if (!validateTT(tt)) {
        Alert.alert('TT Inválido', 'O TT deve ter pelo menos 3 caracteres.');
        return;
      }

      if (password.length < 6) {
        Alert.alert('Senha Fraca', 'A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      const numericAltura = parseFloat(altura);
      if (isNaN(numericAltura) || numericAltura < 1.0 || numericAltura > 2.51) {
        Alert.alert('Altura Inválida', 'Por favor, insira uma altura válida entre 1.00m e 2.51m.');
        return;
      }

      if (!playerTermsAccepted) {
        Alert.alert('Termos de Uso', 'Você precisa aceitar os Termos de Uso para continuar.');
        return;
      }

      try {
        console.log('[RegisterScreen] Iniciando cadastro PLAYER com dados:', {
          name,
          email,
          password: '********', // Não logue a senha
          tt,
          altura,
          role: 'player'
        });

        const playerParams: RegisterPlayerParams = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          tt: tt.trim(),
          altura,
          role: 'player'
        };

        const response: RegisterResponse = await register(playerParams);
        console.log('[RegisterScreen] Resposta da função register (PLAYER):', response);

        if (response && response.token) {
          console.log('[RegisterScreen] PLAYER - Token encontrado na resposta! Fazendo login automático...');
          const loginSuccess = await loginContext(email, password, 'player');
          console.log('[RegisterScreen] PLAYER - loginSuccess:', loginSuccess);

          Alert.alert(
            'Cadastro Realizado',
            'Seu cadastro foi realizado com sucesso!',
            [
              {
                text: 'OK',
                onPress: () => {
                  if (loginSuccess) {
                    navigation.navigate('MainApp');
                  } else {
                    navigation.navigate('Login', { initialRole: 'player' });
                  }
                }
              }
            ]
          );
        } else {
          console.log('[RegisterScreen] PLAYER - Sem token na resposta ou registro falhou.');
          Alert.alert('Erro', 'Registro falhou. Por favor, tente novamente.');
        }
      } catch (error: any) {
        console.log('[RegisterScreen] Erro no registro PLAYER:', error);
        Alert.alert(
          'Erro no Cadastro',
          error.message || 'Não foi possível completar o registro. Por favor, tente novamente.'
        );
      }
    } else {
      if (!companyName || !email || !password || !confirmPassword || !cnpj || !phone || !address) {
        Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Senhas não conferem', 'As senhas digitadas não são iguais.');
        return;
      }
      if (!termsAccepted) {
        Alert.alert('Termos de Uso', 'Você precisa aceitar os Termos de Uso para continuar.');
        return;
      }

      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      if (!cnpjRegex.test(cnpj)) {
        Alert.alert('CNPJ Inválido', 'Digite um CNPJ no formato XX.XXX.XXX/XXXX-XX');
        return;
      }

      try {
        console.log('[RegisterScreen] Iniciando cadastro GESTOR com dados:', {
          companyName,
          email,
          password,
          cnpj,
          phone,
          address
        });
        const courtOwnerParams: RegisterCourtOwnerParams = {
          companyName,
          email,
          password,
          cnpj,
          phone,
          address
        };
        const response: RegisterResponse = await registerCourtOwner(courtOwnerParams);
        console.log('[RegisterScreen] Resposta da função registerCourtOwner (GESTOR):', response);

        if (response && response.token) {
          console.log('[RegisterScreen] GESTOR - Token encontrado na resposta! Fazendo login automático...');
          const loginSuccess = await loginContext(email, password, 'courtOwner');
          console.log('[RegisterScreen] GESTOR - loginSuccess:', loginSuccess);

          if (response.empresa) {
            console.log('[RegisterScreen] Atualizando company context para a nova empresa =>', response.empresa);
            setCompany(response.empresa);
          }

          Alert.alert(
            'Cadastro Realizado',
            'Seu estabelecimento foi cadastrado com sucesso!',
            [
              {
                text: 'OK',
                onPress: () => {
                  if (loginSuccess) {
                    navigation.replace('GestorStack');
                  } else {
                    navigation.navigate('Login', { initialRole: 'courtOwner' });
                  }
                }
              }
            ]
          );
        } else {
          console.log('[RegisterScreen] GESTOR - Sem token na resposta ou registro falhou.');
          Alert.alert('Erro', 'Registro falhou. Tente novamente.');
        }
      } catch (error) {
        console.log('[RegisterScreen] Erro no registro GESTOR:', error);
        Alert.alert('Erro', 'Não foi possível completar o registro. Tente novamente.');
      }
    }
  };

  // Toggle do papel
  const toggleUserRole = (): void => {
    const newRole: UserRole = userRole === 'player' ? 'courtOwner' : 'player';
    setUserRole(newRole);
    setEmail('');
    setPassword('');
  };

  // Formatações de campo
  const formatHeight = (text: string): string => {
    let formattedText = text.replace(/[^0-9]/g, '');
    if (formattedText.length > 2) {
      formattedText = formattedText.slice(0, -2) + '.' + formattedText.slice(-2);
    }
    return formattedText;
  };

  const formatCNPJ = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    let formatted = '';
    if (numbers.length <= 2) {
      formatted = numbers;
    } else if (numbers.length <= 5) {
      formatted = `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      formatted = `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    } else if (numbers.length <= 12) {
      formatted = `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    } else {
      formatted = `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
    return formatted;
  };

  const formatPhone = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    let formatted = '';
    if (numbers.length <= 2) {
      formatted = `(${numbers}`;
    } else if (numbers.length <= 7) {
      formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    return formatted;
  };

  // Componentes
  const PlayerHeader: React.FC = () => (
    <LinearGradient
      colors={['#1A91DA', '#37A0EC', '#59B0FA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={playerStyles.headerGradient}
    >
      <View style={playerStyles.headerContent}>
        <View style={playerStyles.iconContainer}>
          <Ionicons name="football" size={40} color="#37A0EC" />
        </View>
        <Text style={playerStyles.headerTitle}>Bom te conhecer!</Text>
        <Text style={playerStyles.headerSubtitle}>Vamos começar sua jornada no Jogatta</Text>
      </View>
    </LinearGradient>
  );

  const CourtOwnerHeader: React.FC = () => (
    <LinearGradient
      colors={['#FF5414', '#FF7014', '#FF8A3D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={courtOwnerStyles.headerGradient}
    >
     
      <View style={courtOwnerStyles.headerContent}>
        <View style={courtOwnerStyles.iconContainer}>
          <Ionicons name="business-outline" size={40} color="#FF7014" />
        </View>
        <Text style={courtOwnerStyles.headerTitle}>Jogatta Gestor</Text>
        <Text style={courtOwnerStyles.headerSubtitle}>Gerencie suas quadras</Text>
      </View>
    </LinearGradient>
  );

  const PlayerLoginButton: React.FC = () => (
    <TouchableOpacity
      style={playerStyles.loginButtonContainer}
      onPress={handleRegister}
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

  const CourtOwnerLoginButton: React.FC = () => (
    <TouchableOpacity
      style={courtOwnerStyles.loginButtonContainer}
      onPress={handleRegister}
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
            {userRole === 'player' ? (
              <>
                <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                  <Text style={playerStyles.inputLabel}>Nome Completo</Text>
                  <View style={[playerStyles.inputWrapper, { borderColor: name ? '#37A0EC' : '#E0E7FF' }]}>
                    <Ionicons name="person-outline" size={22} color="#37A0EC" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { fontSize: 16 }]}
                      value={name}
                      onChangeText={setName}
                      placeholder="Digite seu nome completo"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                  <Text style={playerStyles.inputLabel}>E-mail</Text>
                  <View style={[playerStyles.inputWrapper, { borderColor: email ? '#37A0EC' : '#E0E7FF' }]}>
                    <Ionicons name="mail-outline" size={22} color="#37A0EC" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { fontSize: 16 }]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Digite seu melhor e-mail"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                  <Text style={playerStyles.inputLabel}>Senha</Text>
                  <View style={[
                    playerStyles.inputWrapper, 
                    { 
                      borderColor: passwordStrength === 'strong' ? '#10B981' : 
                                  passwordStrength === 'medium' ? '#F59E0B' :
                                  passwordStrength === 'weak' ? '#EF4444' :
                                  '#E0E7FF'
                    }
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={22} 
                      color={
                        passwordStrength === 'strong' ? '#10B981' : 
                        passwordStrength === 'medium' ? '#F59E0B' :
                        passwordStrength === 'weak' ? '#EF4444' :
                        '#37A0EC'
                      } 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[styles.input, { fontSize: 16 }]}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        checkPasswordStrength(text);
                      }}
                      placeholder="Crie uma senha segura"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={secureTextEntry}
                      textContentType="newPassword"
                      autoComplete="off"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                      style={[styles.toggleButton, { padding: 8 }]}
                    >
                      <Ionicons
                        name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color={
                          passwordStrength === 'strong' ? '#10B981' : 
                          passwordStrength === 'medium' ? '#F59E0B' :
                          passwordStrength === 'weak' ? '#EF4444' :
                          '#37A0EC'
                        }
                      />
                    </TouchableOpacity>
                  </View>
                  {password && (
                    <Text style={[
                      playerStyles.infoText,
                      { 
                        color: passwordStrength === 'strong' ? '#10B981' : 
                               passwordStrength === 'medium' ? '#F59E0B' :
                               '#EF4444',
                        marginTop: 8
                      }
                    ]}>
                      {passwordStrength === 'strong' ? '✓ Senha forte!' :
                       passwordStrength === 'medium' ? '⚠️ Senha média - adicione mais caracteres especiais' :
                       '⚠️ Senha fraca - use letras, números e caracteres especiais'}
                    </Text>
                  )}
                </View>

                <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                  <Text style={playerStyles.inputLabel}>Seu TT</Text>
                  <View style={[playerStyles.inputWrapper, { borderColor: tt ? '#37A0EC' : '#E0E7FF' }]}>
                    <Ionicons name="at-outline" size={22} color="#37A0EC" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { fontSize: 16 }]}
                      value={tt}
                      onChangeText={setTt}
                      placeholder="Crie seu TT único"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <Text style={playerStyles.infoText}>
                    TT é seu identificador único no Jogatta, escolha com cuidado!
                  </Text>
                </View>

                <View style={[styles.inputGroup, { marginBottom: 25 }]}>
                  <Text style={playerStyles.inputLabel}>Altura (m)</Text>
                  <View style={[playerStyles.inputWrapper, { borderColor: altura ? '#37A0EC' : '#E0E7FF' }]}>
                    <Ionicons name="resize-outline" size={22} color="#37A0EC" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { fontSize: 16 }]}
                      value={altura}
                      onChangeText={(text) => setAltura(formatHeight(text))}
                      placeholder="Ex.: 1.75"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={playerStyles.termsContainer}
                  onPress={() => setPlayerTermsAccepted(!playerTermsAccepted)}
                  activeOpacity={0.7}
                >
                  <View style={playerStyles.checkbox}>
                    {playerTermsAccepted && <Ionicons name="checkmark" size={18} color="#37A0EC" />}
                  </View>
                  <Text style={playerStyles.termsText}>
                    Li e aceito os <Text style={playerStyles.termsLink}>Termos de Uso</Text> do Jogatta.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[playerStyles.registerButton, !playerTermsAccepted && { opacity: 0.6, backgroundColor: '#94A3B8' }]}
                  onPress={handleRegister}
                  disabled={!playerTermsAccepted}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FF5414', '#FF7014', '#FF8A3D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={playerStyles.registerButtonGradient}
                  >
                    <Ionicons name="football-outline" size={24} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={playerStyles.registerButtonText}>Cadastrar Jogador</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={courtOwnerStyles.inputLabel}>Nome da Empresa</Text>
                  <View style={courtOwnerStyles.inputWrapper}>
                    <Ionicons name="business-outline" size={20} color="#2F5BA7" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={companyName}
                      onChangeText={setCompanyName}
                      placeholder="Nome do seu estabelecimento"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={courtOwnerStyles.inputLabel}>CNPJ</Text>
                  <View style={courtOwnerStyles.inputWrapper}>
                    <Ionicons name="document-text-outline" size={20} color="#2F5BA7" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={cnpj}
                      onChangeText={(text) => setCnpj(formatCNPJ(text))}
                      placeholder="XX.XXX.XXX/XXXX-XX"
                      keyboardType="number-pad"
                      placeholderTextColor="#999"
                      maxLength={18}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={courtOwnerStyles.inputLabel}>E-mail</Text>
                  <View style={courtOwnerStyles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#2F5BA7" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="E-mail comercial"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={courtOwnerStyles.inputLabel}>Telefone</Text>
                  <View style={courtOwnerStyles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#2F5BA7" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={(text) => setPhone(formatPhone(text))}
                      placeholder="(XX) XXXXX-XXXX"
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                      maxLength={15}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={courtOwnerStyles.inputLabel}>Endereço</Text>
                  <View style={courtOwnerStyles.inputWrapper}>
                    <Ionicons name="location-outline" size={20} color="#2F5BA7" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Endereço completo da quadra"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={courtOwnerStyles.inputLabel}>Senha</Text>
                  <View style={courtOwnerStyles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#4A5871" style={styles.inputIcon} />
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
                      style={styles.toggleButton}
                    >
                      <Ionicons
                        name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                        size={22}
                        color="#4A5871"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={courtOwnerStyles.inputLabel}>Confirme sua senha</Text>
                  <View style={courtOwnerStyles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#4A5871" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Digite sua senha novamente"
                      secureTextEntry={secureTextEntry}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={courtOwnerStyles.termsContainer}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  activeOpacity={0.7}
                >
                  <View style={courtOwnerStyles.checkbox}>
                    {termsAccepted && <Ionicons name="checkmark" size={18} color="#3498DB" />}
                  </View>
                  <Text style={courtOwnerStyles.termsText}>
                    Li e aceito os <Text style={courtOwnerStyles.termsLink}>Termos de Uso</Text> do Jogatta Gestor.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[courtOwnerStyles.registerButton, !termsAccepted && courtOwnerStyles.disabledButton]}
                  onPress={handleRegister}
                  disabled={!termsAccepted}
                >
                  <LinearGradient
                    colors={['#1A91DA', '#37A0EC', '#59B0FA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={playerStyles.registerButtonGradient}
                  >
                    <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={courtOwnerStyles.registerButtonText}>Cadastrar Estabelecimento</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login', { initialRole: userRole })}>
                <Text style={userRole === 'player' ? playerStyles.loginLink : courtOwnerStyles.loginLink}>
                  Faça login
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.switchRoleButton} onPress={toggleUserRole}>
              <Text style={userRole === 'player' ? playerStyles.switchRoleText : courtOwnerStyles.switchRoleText}>
                {userRole === 'player' ? 'Cadastrar como Dono de Quadra' : 'Cadastrar como Jogador'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create<Styles>({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  safeArea: { 
    flex: 1,
  
  },
  backButton: {

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
    paddingBottom: 40 
  },
  inputGroup: { 
    marginBottom: 16 
  },
  inputIcon: { 
    paddingHorizontal: 12 
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  loginText: { 
    color: '#777', 
    fontSize: 15 
  },
  switchRoleButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 5,
  },
  buttonIcon: { 
    marginRight: 8 
  },
  toggleButton: { 
    paddingHorizontal: 10, 
    paddingVertical: 8 
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#333',
    fontSize: 16,
  },
});

const playerStyles = StyleSheet.create<PlayerStyles>({
  
  headerGradient: {
    height:  300,
    top: 0,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { 
    alignItems: 'center', 
    paddingHorizontal: 30,
    top: 20,
    
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,

  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  headerSubtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    paddingLeft: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderRadius: 15,
    backgroundColor: '#F8FAFF',
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: { 
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    paddingLeft: 5,
    fontStyle: 'italic'
  },
  registerButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 25,
    shadowColor: '#FF7014',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  registerButtonGradient: {
    height: 58,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 5,
    elevation: 3,
    shadowColor: '#FF7014',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 12,
  },
  buttonIcon: { 
    marginRight: 12 
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#F8FAFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#37A0EC',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  termsText: {
    color: '#2C3E50',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#FF7014',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  loginLink: { 
    color: '#FF7014',
    fontSize: 16,
    fontWeight: '600'
  },
  switchRoleText: { 
    color: '#FF7014',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9
  }
});

const courtOwnerStyles = StyleSheet.create<CourtOwnerStyles>({
  
  headerGradient: {
    height:  300,
    top: 0,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { 
    alignItems: 'center', 
    paddingHorizontal: 30,
    top: 20,
    
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,

  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  headerSubtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24
  },
  loginButtonContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 5,
    elevation: 3,
    shadowColor: '#37A0EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 15,
  },
  buttonIcon: { 
    marginRight: 12 
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    paddingLeft: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderRadius: 15,
    backgroundColor: '#F8FAFF',
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#F8FAFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#FF7014',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  termsText: {
    color: '#2C3E50',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#37A0EC',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 25,
    shadowColor: '#37A0EC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  disabledButton: { 
    opacity: 0.6,
    backgroundColor: '#94A3B8',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginLink: { 
    color: '#37A0EC',
    fontSize: 16,
    fontWeight: '600'
  },
  switchRoleText: { 
    color: '#37A0EC',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -80,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default RegisterScreen; 
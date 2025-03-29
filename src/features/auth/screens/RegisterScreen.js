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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { register, registerCourtOwner } from '../../../features/auth/services/authService';
import AuthContext from '../../../contexts/AuthContext';
// Importa o CompanyContext para atualizar a empresa no cadastro do Gestor
import CompanyContext from '../../../contexts/CompanyContext';

const RegisterScreen = ({ navigation, route }) => {
  const initialRole = route.params?.initialRole || 'player';

  // Estados para jogador
  const [userRole, setUserRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tt, setTt] = useState('');
  const [altura, setAltura] = useState('');

  // Estados para dono de quadra (Gestor)
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Estado para exibir/ocultar senha
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Obtém o login do contexto para salvar o token no AsyncStorage após o cadastro
  const { login: loginContext } = useContext(AuthContext);
  // Extrai o setCompany para atualizar o contexto com a nova empresa
  const { setCompany } = useContext(CompanyContext);

  useEffect(() => {
    if (route.params?.initialRole) {
      setUserRole(route.params.initialRole);
    }
  }, [route.params]);

  // Função principal de cadastro
  const handleRegister = async () => {
    console.log('[RegisterScreen] handleRegister iniciado. userRole:', userRole);

    if (userRole === 'player') {
      // Validações específicas de jogador
      if (!name || !email || !password || !tt || !altura) {
        Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
        return;
      }
      const numericAltura = parseFloat(altura);
      if (numericAltura > 2.51) {
        Alert.alert('Você é tão alto assim?', 'A altura máxima permitida é 2.51m.');
        return;
      }

      try {
        console.log('[RegisterScreen] Iniciando cadastro PLAYER com dados:', {
          name,
          email,
          password,
          tt,
          altura,
          role: 'player'
        });
        const response = await register(name, email, password, tt, altura, 'player');
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
          Alert.alert('Erro', 'Registro falhou. Tente novamente.');
        }
      } catch (error) {
        console.log('[RegisterScreen] Erro no registro PLAYER:', error);
        Alert.alert('Erro', 'Não foi possível completar o registro. Tente novamente.');
      }
    } else {
      // Validações para dono de quadra (Gestor)
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

      // Checa se o CNPJ está no formato XX.XXX.XXX/XXXX-XX
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
          address,
          confirmPassword,
          termsAccepted
        });
        const response = await registerCourtOwner(companyName, email, password, cnpj, phone, address);
        console.log('[RegisterScreen] Resposta da função registerCourtOwner (GESTOR):', response);

        if (response && response.token) {
          console.log('[RegisterScreen] GESTOR - Token encontrado na resposta! Fazendo login automático...');
          const loginSuccess = await loginContext(email, password, 'courtOwner');
          console.log('[RegisterScreen] GESTOR - loginSuccess:', loginSuccess);

          // Atualiza o contexto da empresa se a resposta possuir empresa
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
  const toggleUserRole = () => {
    const newRole = userRole === 'player' ? 'courtOwner' : 'player';
    setUserRole(newRole);
    setEmail('');
    setPassword('');
  };

  // Formatações de campo
  const formatHeight = (text) => {
    let formattedText = text.replace(/[^0-9]/g, '');
    if (formattedText.length > 2) {
      formattedText = formattedText.slice(0, -2) + '.' + formattedText.slice(-2);
    }
    return formattedText;
  };

  const formatCNPJ = (text) => {
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

  const formatPhone = (text) => {
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

  // Layouts específicos para cada papel
  const PlayerHeader = () => (
    <LinearGradient
      colors={['#1A91DA', '#37A0EC', '#59B0FA']}
      style={playerStyles.headerGradient}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <View style={playerStyles.headerContent}>
        <Image style={playerStyles.headerIcon} resizeMode="contain" />
        <Text style={playerStyles.headerTitle}>Bom te conhecer!</Text>
        <Text style={playerStyles.headerSubtitle}>Vamos começar a jogar!</Text>
      </View>
    </LinearGradient>
  );

  const CourtOwnerHeader = () => (
    <LinearGradient
      colors={['#37424E', '#425062', '#4A5871']}
      style={courtOwnerStyles.headerGradient}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <View style={courtOwnerStyles.headerContent}>
        <View style={courtOwnerStyles.iconContainer}>
          <Ionicons name="calendar-outline" size={32} color="#FF7014" />
        </View>
        <Text style={courtOwnerStyles.headerTitle}>Jogatta Gestor</Text>
        <Text style={courtOwnerStyles.headerSubtitle}>Cadastre suas quadras e comece a receber</Text>
      </View>
    </LinearGradient>
  );

  const PlayerLoginButton = () => (
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

  const CourtOwnerLoginButton = () => (
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
                {/* CAMPOS DE JOGADOR */}
                <View style={styles.inputGroup}>
                  <Text style={playerStyles.inputLabel}>Nome Completo</Text>
                  <View style={playerStyles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#37A0EC" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Digite seu nome completo"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={playerStyles.inputLabel}>E-mail</Text>
                  <View style={playerStyles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#37A0EC" style={styles.inputIcon} />
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
                  <Text style={playerStyles.inputLabel}>Senha</Text>
                  <View style={playerStyles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#37A0EC" style={styles.inputIcon} />
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
                        color="#37A0EC"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={playerStyles.inputLabel}>Seu TT</Text>
                  <View style={playerStyles.inputWrapper}>
                    <Ionicons name="at-outline" size={20} color="#37A0EC" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={tt}
                      onChangeText={setTt}
                      placeholder="Crie seu TT único"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <Text style={playerStyles.infoText}>
                    TT é o seu identificador único no Jogatta
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={playerStyles.inputLabel}>Altura (m)</Text>
                  <View style={playerStyles.inputWrapper}>
                    <Ionicons name="resize-outline" size={20} color="#37A0EC" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={altura}
                      onChangeText={(text) => setAltura(formatHeight(text))}
                      placeholder="Ex.: 1.75"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={playerStyles.registerButton}
                  onPress={handleRegister}
                >
                  <LinearGradient
                    colors={['#FF7014', '#FF8A3D', '#FF7014']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={playerStyles.registerButtonGradient}
                  >
                    <Ionicons name="football-outline" size={20} color="#FFF" style={styles.buttonIcon} />
                    <Text style={playerStyles.registerButtonText}>Cadastrar Jogador</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* CAMPOS DE DONO DE QUADRA */}
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
                    {termsAccepted && <Ionicons name="checkmark" size={18} color="#FF7014" />}
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
                  <Ionicons name="checkmark-circle-outline" size={22} color="#FF7014" style={styles.buttonIcon} />
                  <Text style={courtOwnerStyles.registerButtonText}>Cadastrar Estabelecimento</Text>
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

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  safeArea: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    zIndex: 10,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -25,
  },
  scrollContent: { padding: 25, paddingBottom: 40 },
  inputGroup: { marginBottom: 16 },
  inputIcon: { paddingHorizontal: 12 },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  loginText: { color: '#777', fontSize: 15 },
  switchRoleButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 5,
  },
  buttonIcon: { marginRight: 8 },
  toggleButton: { paddingHorizontal: 10, paddingVertical: 8 },
});

const playerStyles = StyleSheet.create({
  headerGradient: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  headerContent: { alignItems: 'center', paddingHorizontal: 30 },
  headerIcon: { width: 60, height: 60, marginBottom: 10 },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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

const courtOwnerStyles = StyleSheet.create({
  headerGradient: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  headerContent: { alignItems: 'center', paddingHorizontal: 30 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#FF7014',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    color: '#4A5871',
    flex: 1,
  },
  termsLink: {
    color: '#FF7014',
    textDecorationLine: 'underline',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF7014',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  disabledButton: { opacity: 0.5 },
  registerButtonText: {
    color: '#FF7014',
    fontWeight: '600',
    fontSize: 16,
  },
  loginLink: { color: '#FF7014' },
  switchRoleText: { color: '#FF7014' },
});

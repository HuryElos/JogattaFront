// src/features/auth/screens/RegisterScreen.js

import React, { useState } from 'react';
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
  SafeAreaView
} from 'react-native';
import { register } from '../../../features/auth/services/authService';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tt, setTt] = useState('');
  const [altura, setAltura] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleRegister = async () => {
    if (!name || !email || !password || !tt || !altura) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    const numericAltura = parseFloat(altura);
    if (numericAltura > 2.51) {
      Alert.alert(
        'Você é tão alto assim?',
        'A altura máxima permitida é 2.51m.'
      );
      return;
    }

    try {
      const response = await register(name, email, password, tt, altura);
      if (response) {
        Alert.alert(
          'Cadastro Realizado',
          'Seu cadastro foi realizado com sucesso!',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Erro', 'Registro falhou. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível completar o registro. Tente novamente.');
    }
  };

  const formatHeight = (text) => {
    // Remove caracteres não numéricos
    let formattedText = text.replace(/[^0-9]/g, '');
    // Adiciona o ponto para separar metros e centímetros
    if (formattedText.length > 2) {
      formattedText = formattedText.slice(0, -2) + '.' + formattedText.slice(-2);
    }
    return formattedText;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            {/* Mantido o ícone de “voltar” */}
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Bom te conhecer!</Text>
        </View>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* E-mail */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <View style={styles.inputWrapper}>
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

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Digite sua senha"
                  secureTextEntry={secureTextEntry}
                  placeholderTextColor="#999"
                />
                {/* Botão de mostrar/ocultar senha (sem ícone) */}
                <TouchableOpacity 
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  style={styles.toggleButton}
                >
                  <Text style={styles.toggleText}>
                    {secureTextEntry ? 'Mostrar' : 'Ocultar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TT */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Seu TT</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={tt}
                  onChangeText={setTt}
                  placeholder="Crie seu TT único"
                  placeholderTextColor="#999"
                />
              </View>
              <Text style={styles.infoText}>TT é o seu identificador único no Jogatta</Text>
            </View>

            {/* Altura */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Altura (m)</Text>
              <View style={styles.inputWrapper}>
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

            {/* Botão de cadastro */}
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>Cadastrar</Text>
            </TouchableOpacity>

            {/* Link para Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Faça login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#37A0EC',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 25,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
  },
  scrollContent: {
    padding: 25,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  // Botão de toggle para a senha (substituindo o ícone)
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleText: {
    color: '#37A0EC',
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
    paddingLeft: 5,
  },
  registerButton: {
    backgroundColor: '#FF7014',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#FF7014',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  loginText: {
    color: '#777',
    fontSize: 15,
  },
  loginLink: {
    color: '#37A0EC',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RegisterScreen;

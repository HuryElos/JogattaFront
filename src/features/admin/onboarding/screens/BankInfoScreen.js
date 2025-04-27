import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingForm } from '../useOnboardingForm';

export default function BankInfoScreen() {
  const navigation = useNavigation();
  const { formData, updateForm } = useOnboardingForm();

  const [nomeTitular, setNomeTitular] = useState(formData.nome_titular || '');
  const [banco, setBanco] = useState(formData.banco || '');
  const [agencia, setAgencia] = useState(formData.agencia || '');
  const [conta, setConta] = useState(formData.conta || '');
  const [tipo, setTipo] = useState(formData.tipo || 'individual');

  const preencherAutomaticamente = () => {
    setNomeTitular('João da Silva');
    setBanco('110'); // Banco de teste para o Brasil
    setAgencia('0000');
    setConta('0001234'); // Conta de teste
    setTipo('individual');
  };

  const handleNext = () => {
    updateForm({
      nome_titular: nomeTitular,
      banco,
      agencia,
      conta,
      tipo
    });
    navigation.navigate('ConfirmOnboarding');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dados bancários</Text>

      <Text style={styles.label}>Nome do titular</Text>
      <TextInput style={styles.input} value={nomeTitular} onChangeText={setNomeTitular} />

      <Text style={styles.label}>Código do banco (ex: 001, 104, 260...)</Text>
      <TextInput style={styles.input} value={banco} onChangeText={setBanco} />

      <Text style={styles.label}>Agência</Text>
      <TextInput style={styles.input} value={agencia} onChangeText={setAgencia} />

      <Text style={styles.label}>Conta</Text>
      <TextInput style={styles.input} value={conta} onChangeText={setConta} />

      <TouchableOpacity style={styles.autofillButton} onPress={preencherAutomaticamente}>
        <Text style={styles.autofillButtonText}>Completar dados automaticamente</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Avançar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1A1A1A'
  },
  label: {
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 4,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  autofillButton: {
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24
  },
  autofillButtonText: {
    color: '#1A1A1A',
    fontWeight: 'bold'
  },
  nextButton: {
    backgroundColor: '#FF7014',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});

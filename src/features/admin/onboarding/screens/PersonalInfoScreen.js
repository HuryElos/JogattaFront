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

export default function PersonalInfoScreen() {
  const navigation = useNavigation();
  const { formData, updateForm } = useOnboardingForm();

  const [nomeCompleto, setNomeCompleto] = useState(formData.nome_completo || '');
  const [cpf, setCpf] = useState(formData.cpf || '');
  const [nascimento, setNascimento] = useState(formData.nascimento || '');
  const [cep, setCep] = useState(formData.endereco?.cep || '');
  const [rua, setRua] = useState(formData.endereco?.rua || '');
  const [cidade, setCidade] = useState(formData.endereco?.cidade || '');
  const [estado, setEstado] = useState(formData.endereco?.estado || '');

  const preencherAutomaticamente = () => {
    setNomeCompleto('João da Silva');
    setCpf('12345678900');
    setNascimento('1990-05-20');
    setCep('01001-000');
    setRua('Rua Teste da Silva');
    setCidade('São Paulo');
    setEstado('SP');
  };

  const handleNext = () => {
    updateForm({
      nome_completo: nomeCompleto,
      cpf,
      nascimento,
      endereco: {
        cep,
        rua,
        cidade,
        estado
      }
    });
    navigation.navigate('BankInfo');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seus dados pessoais</Text>

      <Text style={styles.label}>Nome completo</Text>
      <TextInput style={styles.input} value={nomeCompleto} onChangeText={setNomeCompleto} />

      <Text style={styles.label}>CPF</Text>
      <TextInput style={styles.input} value={cpf} onChangeText={setCpf} keyboardType="numeric" />

      <Text style={styles.label}>Data de nascimento (AAAA-MM-DD)</Text>
      <TextInput style={styles.input} value={nascimento} onChangeText={setNascimento} />

      <Text style={styles.label}>CEP</Text>
      <TextInput style={styles.input} value={cep} onChangeText={setCep} />

      <Text style={styles.label}>Rua</Text>
      <TextInput style={styles.input} value={rua} onChangeText={setRua} />

      <Text style={styles.label}>Cidade</Text>
      <TextInput style={styles.input} value={cidade} onChangeText={setCidade} />

      <Text style={styles.label}>Estado (ex: SP)</Text>
      <TextInput style={styles.input} value={estado} onChangeText={setEstado} />

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

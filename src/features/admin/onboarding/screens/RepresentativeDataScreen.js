import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import api from '../../../../services/api';
import CompanyContext from '../../../../contexts/CompanyContext';

export default function RepresentativeDataScreen({ navigation }) {
  const { company } = useContext(CompanyContext);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const handleEnviarDados = async () => {
    if (!company?.stripe_account_id) {
      Alert.alert('Erro', 'Conta Stripe não encontrada para essa empresa.');
      return;
    }

    try {
      const payload = {
        stripe_account_id: company.stripe_account_id,
        nome_completo: nomeCompleto,
        cpf,
        nascimento,
        endereco: {
          cep,
          rua,
          cidade,
          estado
        }
      };

      await api.post('/api/stripe/onboarding/update-account', payload);

      Alert.alert('Sucesso', 'Dados enviados com sucesso!');
      navigation.navigate('BankAccount');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível enviar os dados.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nome Completo</Text>
      <TextInput style={styles.input} value={nomeCompleto} onChangeText={setNomeCompleto} />

      <Text style={styles.label}>CPF</Text>
      <TextInput style={styles.input} value={cpf} onChangeText={setCpf} keyboardType="numeric" />

      <Text style={styles.label}>Data de Nascimento (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={nascimento} onChangeText={setNascimento} />

      <Text style={styles.label}>CEP</Text>
      <TextInput style={styles.input} value={cep} onChangeText={setCep} />

      <Text style={styles.label}>Rua</Text>
      <TextInput style={styles.input} value={rua} onChangeText={setRua} />

      <Text style={styles.label}>Cidade</Text>
      <TextInput style={styles.input} value={cidade} onChangeText={setCidade} />

      <Text style={styles.label}>Estado</Text>
      <TextInput style={styles.input} value={estado} onChangeText={setEstado} />

      <TouchableOpacity style={styles.button} onPress={handleEnviarDados}>
        <Text style={styles.buttonText}>Avançar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  label: {
    fontWeight: 'bold',
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 4,
    borderRadius: 8
  },
  button: {
    backgroundColor: '#FF7014',
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

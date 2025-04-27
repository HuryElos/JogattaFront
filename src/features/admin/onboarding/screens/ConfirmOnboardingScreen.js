// 📁 src/features/admin/onboarding/screens/ConfirmOnboardingScreen.js

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingForm } from '../useOnboardingForm';
import CONFIG from '../../../../config/config';

export default function ConfirmOnboardingScreen() {
  const { formData } = useOnboardingForm();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('📦 Enviando para:', CONFIG.BASE_URL);

      if (!formData.stripe_account_id) {
        throw new Error('Stripe Account ID ausente');
      }

      // 1. Enviar dados pessoais
      const dadosPessoais = {
        stripe_account_id: formData.stripe_account_id,
        nome_completo: formData.nome_completo,
        cpf: formData.cpf,
        nascimento: formData.nascimento,
        endereco: {
          rua: formData.endereco?.rua,
          cidade: formData.endereco?.cidade,
          estado: formData.endereco?.estado,
          cep: formData.endereco?.cep
        }
      };
      console.log('📤 Dados pessoais:', dadosPessoais);

      await axios.post(`${CONFIG.BASE_URL}/api/connect/update-account`, dadosPessoais);

      // 2. Enviar dados bancários
      const dadosBancarios = {
        stripe_account_id: formData.stripe_account_id,
        nome_titular: formData.nome_titular,
        tipo: formData.tipo,
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta
      };
      console.log('📤 Dados bancários:', dadosBancarios);

      await axios.post(`${CONFIG.BASE_URL}/api/connect/add-bank-account`, dadosBancarios);

      Alert.alert('✅ Sucesso', 'Dados enviados com sucesso!');
      navigation.navigate('ManageCompany');

    } catch (err) {
      console.error('❌ Erro ao finalizar onboarding:', err);
      Alert.alert('Erro', err?.message || 'Não foi possível concluir o onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Confirme suas informações</Text>

      <Text style={styles.label}>Nome completo: {formData.nome_completo}</Text>
      <Text style={styles.label}>CPF: {formData.cpf}</Text>
      <Text style={styles.label}>Nascimento: {formData.nascimento}</Text>
      <Text style={styles.label}>
        Endereço: {formData.endereco?.rua}, {formData.endereco?.cidade} - {formData.endereco?.estado}, {formData.endereco?.cep}
      </Text>

      <Text style={styles.label}>Banco: {formData.banco}</Text>
      <Text style={styles.label}>Agência: {formData.agencia}</Text>
      <Text style={styles.label}>Conta: {formData.conta}</Text>

      <Button
        title={loading ? 'Enviando...' : 'Concluir'}
        onPress={handleSubmit}
        disabled={loading}
        color="#FF7014"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  label: {
    marginVertical: 5
  }
});

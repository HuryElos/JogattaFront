import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingForm } from '../useOnboardingForm';
import CompanyContext from '../../../../contexts/CompanyContext';
import api from '../../../../services/api'; // usa esse mesmo

export default function IntroOnboardingScreen() {
  const navigation = useNavigation();
  const { updateForm } = useOnboardingForm();
  const { company } = useContext(CompanyContext);

  const handleStart = async () => {
    try {
      const response = await api.post('/api/connect/create-stripe-account', {
        id_empresa: company.id_empresa,
        email: company.email,
      });

      const stripeAccountId = response.data.stripe_account_id;


      if (!stripeAccountId) {
        throw new Error('stripe_account_id ausente na resposta');
      }

      updateForm({ stripe_account_id: stripeAccountId });
      console.log('✅ Conta Stripe criada:', stripeAccountId);

      navigation.navigate('PersonalInfo');
    } catch (err) {
      console.error('❌ Erro ao criar conta Stripe:', err);
      Alert.alert('Erro', 'Não foi possível criar sua conta Stripe. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        // source={require('../../../../assets/illustrations/payment.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Vamos configurar sua conta para receber pagamentos</Text>
      <Text style={styles.subtitle}>
        Precisamos de algumas informações para garantir a segurança e legalidade do processo.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 280,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FF7014',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

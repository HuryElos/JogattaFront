import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { createPaymentIntent } from '../../../services/paymentService';

const PagamentoScreen = () => {
  const { confirmPayment } = useStripe();
  const [cardDetails, setCardDetails] = useState();

  const handlePayPress = async () => {
    try {
      const clientSecret = await createPaymentIntent(1000); // R$10,00
      
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Erro no pagamento', error.message);
      } else if (paymentIntent) {
        Alert.alert('Pagamento realizado!', `ID: ${paymentIntent.id}`);
      }
    } catch (err) {
      console.log('Erro ao criar PaymentIntent:', err.message); // Pra debug
      Alert.alert('Erro', 'Não foi possível processar o pagamento.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <CardField
        postalCodeEnabled={false}
        placeholders={{ number: '4242 4242 4242 4242' }}
        onCardChange={setCardDetails}
        style={{ height: 50, marginVertical: 30 }}
      />
      <Button title="Pagar" onPress={handlePayPress} />
    </View>
  );
};

export default PagamentoScreen;

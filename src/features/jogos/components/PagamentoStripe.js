// src/features/jogos/components/PagamentoStripe.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import api from '../../../services/api';

export default function PagamentoStripe({
  reservaId,
  ownerId,
  amount,              // valor total da quadra em centavos
  id_usuario,
  onClose,
  quantidadeJogadores,
  onPaymentSuccess,
  forcarAtualizacaoStatusJogador
}) {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // Criar PaymentIntent no início
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        console.log('Criando PaymentIntent com valores:', {
          amount: Math.round(amount / quantidadeJogadores),
          ownerId,
          reservaId,
          id_usuario
        });

        const response = await api.post('/api/payments/create-payment-intent', {
          amount: Math.round(amount / quantidadeJogadores),
          currency: 'brl',
          ownerId,
          reservaId,
          id_usuario,
          is_test: true // Indica que é um pagamento de teste
        });

        if (response.data?.clientSecret) {
          console.log('ClientSecret recebido com sucesso');
          setClientSecret(response.data.clientSecret);
        } else {
          throw new Error('ClientSecret não recebido');
        }
      } catch (error) {
        console.error('Erro ao criar PaymentIntent:', error);
        Alert.alert(
          'Erro',
          'Não foi possível iniciar o pagamento. Tente novamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, []);

  const handlePayPress = async () => {
    try {
      setLoading(true);
      console.log('===> Iniciando processamento do pagamento <===');

      if (!clientSecret) {
        throw new Error('ClientSecret não disponível');
      }

      // Confirmar pagamento com Stripe
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card'
      });

      if (error) {
        console.error('Erro Stripe:', error);
        throw new Error(error.message);
      }

      if (!paymentIntent) {
        throw new Error('PaymentIntent não retornado');
      }

      console.log('Pagamento Stripe processado:', paymentIntent);

      // Registrar pagamento no backend
      const response = await api.post('/api/jogador/reservas/pagar', {
        reserva_id: reservaId,
        valor_pago: Math.round(amount / quantidadeJogadores),
        id_usuario,
        force_update: true,
        is_test: true,
        payment_intent_id: paymentIntent.id
      });

      console.log('Resposta do registro de pagamento:', response.data);

      // Atualizar cofre e status
      if (onPaymentSuccess) {
        const atualizacaoCofreOk = await onPaymentSuccess(Math.round(amount / quantidadeJogadores));
        
        if (!atualizacaoCofreOk && forcarAtualizacaoStatusJogador) {
          await forcarAtualizacaoStatusJogador();
        }
      }

      Alert.alert('Sucesso', 'Pagamento processado com sucesso!');
      onClose();

    } catch (error) {
      console.error('Erro no processamento:', error);
      Alert.alert(
        'Erro no Pagamento',
        error.message || 'Não foi possível processar o pagamento.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      )}

      <Text style={styles.title}>Pagamento da Reserva</Text>
      <Text style={styles.subtitle}>
        Valor: R$ {(Math.round(amount / quantidadeJogadores) / 100).toFixed(2)}
      </Text>

      <View style={styles.cardContainer}>
        <Text style={styles.label}>Dados do Cartão</Text>
        <Text style={styles.testCard}>Use o cartão de teste: 4242 4242 4242 4242</Text>
        <CardField
          postalCodeEnabled={false}
          placeholder={{
            number: "4242 4242 4242 4242",
          }}
          cardStyle={{
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.payButton,
          { backgroundColor: cardComplete && !loading ? '#FF6B00' : '#D1D5DB' }
        ]}
        onPress={handlePayPress}
        disabled={!cardComplete || loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processando...' : 'Pagar Agora'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          • Este é um ambiente de testes
        </Text>
        <Text style={styles.infoText}>
          • Você pode fazer múltiplos pagamentos para testar
        </Text>
        <Text style={styles.infoText}>
          • Use qualquer data futura e CVC
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  cardContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  testCard: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 4,
  },
  payButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
});

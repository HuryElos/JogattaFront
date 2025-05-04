import { initStripe, initPaymentSheet as stripeInitPaymentSheet, presentPaymentSheet as stripePresentPaymentSheet } from '@stripe/stripe-react-native';

// Inicializa o Stripe com a chave pública
export const initializeStripe = async () => {
  try {
    await initStripe({
      publishableKey: 'pk_test_51N82cjDQ9JlHtXKK1xwPHGTbaa9IBeag6iImYX0R0Ce2GJOvRfSMSS2KzJII5xkZ1bavgWrmFrBjQ7TNDsiKvgOc0096dfHBBO',
      merchantIdentifier: 'merchant.com.jogatta', // Para Apple Pay
    });
    console.log('✅ Stripe inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Stripe:', error);
    throw error;
  }
};

// Inicializa o PaymentSheet
export const setupPaymentSheet = async ({ paymentIntentClientSecret, merchantDisplayName }) => {
  try {
    const { error } = await stripeInitPaymentSheet({
      paymentIntentClientSecret,
      merchantDisplayName,
      style: 'automatic',
      appearance: {
        colors: {
          primary: '#FF6B00',
        },
      },
    });
    return { error };
  } catch (error) {
    console.error('❌ Erro ao inicializar PaymentSheet:', error);
    return { error };
  }
};

// Apresenta o PaymentSheet
export const showPaymentSheet = async () => {
  try {
    const { error } = await stripePresentPaymentSheet();
    return { error };
  } catch (error) {
    console.error('❌ Erro ao apresentar PaymentSheet:', error);
    return { error };
  }
}; 
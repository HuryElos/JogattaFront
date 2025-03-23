import axios from 'axios';

// IMPORTANTE: Use sempre a URL do Render, não localhost!
const BASE_URL = 'https://backendjogatta.onrender.com';

export const createPaymentIntent = async (amount) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/payments/create-payment-intent`, {
      amount,
      currency: 'brl',
    });

    return response.data.clientSecret;
  } catch (error) {
    console.log('Erro ao criar PaymentIntent:', error.message);
    throw error;
  }
};

export const handleError = (error, customMessage) => {
    if (error.response) {
      console.error(`${customMessage} (resposta da API):`, error.response.data);
    } else if (error.request) {
      console.error(`${customMessage} (sem resposta do servidor):`, error.request);
    } else {
      console.error(`${customMessage} (configuração):`, error.message);
    }
    throw new Error(customMessage);
  };
  
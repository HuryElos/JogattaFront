// /src/features/jogos/components/cofre/CofreActions.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../../../../services/api'; // Ajuste o caminho conforme sua estrutura

const CofreActions = ({ reservaId }) => {
  const [loading, setLoading] = useState(false);
  const [cofreStatus, setCofreStatus] = useState('travado');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLiberarCofre = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[CofreActions] Liberando cofre, reservaId:', reservaId);

      // Faz a requisição usando nossa instância do Axios
      const response = await api.post(`/api/jogador/reservas/${reservaId}/liberar-cofre`);
      console.log('[CofreActions] Resposta da API:', response.data);

      setCofreStatus('liberado');
      setSuccess(true);
    } catch (err) {
      console.error('[CofreActions] Erro:', err);
      // Se err.response existir, podemos pegar err.response.data
      setError(err.message || 'Erro ao liberar cofre');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        Status do Cofre: {cofreStatus === 'liberado' ? 'Liberado' : 'Travado'}
      </Text>

      {success && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Dinheiro liberado para a quadra</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {cofreStatus !== 'liberado' && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleLiberarCofre}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Liberar Cofre</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#34D399',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default CofreActions;

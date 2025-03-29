import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import api from '../../../services/api';

export default function QuadraDetailsScreen({ route }) {
  const { quadraId } = route.params;
  const [quadra, setQuadra] = useState(null);

  useEffect(() => {
    fetchQuadra();
  }, []);

  const fetchQuadra = async () => {
    try {
      // Supondo que a rota seja /api/superadmin/quadras/:id
      const response = await api.get(`/api/quadras/${quadraId}`);

      setQuadra(response.data);
    } catch (error) {
      console.log('Erro ao buscar detalhes da quadra:', error.message);
    }
  };

  if (!quadra) {
    return (
      <View style={styles.container}>
        <Text>Carregando detalhes da quadra...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{quadra.nome}</Text>
      <Text style={styles.subtitle}>Preço/Hora: R$ {quadra.preco_hora}</Text>
      {quadra.hora_abertura && quadra.hora_fechamento && (
        <Text style={styles.subtitle}>
          Funcionamento: {quadra.hora_abertura} - {quadra.hora_fechamento}
        </Text>
      )}
      {quadra.promocao_ativa && (
        <Text style={[styles.subtitle, { color: 'green', marginTop: 10 }]}>
          Promoção: {quadra.descricao_promocao}
        </Text>
      )}
      {quadra.foto ? (
        <Image
          source={{ uri: quadra.foto }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ marginTop: 20 }}>Nenhuma foto cadastrada.</Text>
      )}
      <Text style={styles.subtitle}>
        Rede Disponível: {quadra.rede_disponivel ? 'Sim' : 'Não'}
      </Text>
      <Text style={styles.subtitle}>
        Bola Disponível: {quadra.bola_disponivel ? 'Sim' : 'Não'}
      </Text>
      {quadra.observacoes ? (
        <Text style={styles.subtitle}>Observações: {quadra.observacoes}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 5 },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: '#ccc',
  },
});


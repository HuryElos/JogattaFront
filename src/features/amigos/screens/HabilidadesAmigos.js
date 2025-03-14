// src/features/amigos/screens/HabilidadesAmigos.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from '../../../services/api';

/**
 * Tela para gerenciar habilidades dos amigos.
 *
 * Props:
 * - route: 
 *   - jogoId: ID do jogo (online) ou undefined (offline)
 *   - fluxo: 'online' ou 'offline'
 *   - tempPlayers: (opcional) lista de jogadores temporários já criada
 * - navigation
 */
const HabilidadesAmigos = ({ route, navigation }) => {
  const { jogoId, fluxo, tempPlayers } = route.params || {};
  const [amigos, setAmigos] = useState([]);

  useEffect(() => {
    // Se foi passado uma lista de jogadores temporários, utiliza-a
    if (tempPlayers && Array.isArray(tempPlayers)) {
      setAmigos(tempPlayers);
    } else {
      const fetchHabilidades = async () => {
        try {
          let response;
          if (fluxo === 'online') {
            response = await api.get(`/api/jogos/${jogoId}/habilidades`);
          } else {
            // Endpoint de exemplo para offline
            response = await api.get(`/api/habilidades/offline`);
          }

          if (response.status === 200 && Array.isArray(response.data.jogadores)) {
            setAmigos(response.data.jogadores);
          } else {
            setAmigos([]);
          }
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível buscar as habilidades dos amigos.');
        }
      };

      fetchHabilidades();
    }
  }, [jogoId, fluxo, tempPlayers]);

  const handleChangeHabilidade = (id_usuario, field, value) => {
    setAmigos((prev) =>
      prev.map((amigo) =>
        amigo.id_usuario === id_usuario ? { ...amigo, [field]: value } : amigo
      )
    );
  };

  const salvarHabilidades = async () => {
    try {
      // Validação: todos os valores devem estar entre 1 e 5
      for (const amigo of amigos) {
        if (
          amigo.passe < 1 || amigo.passe > 5 ||
          amigo.ataque < 1 || amigo.ataque > 5 ||
          amigo.levantamento < 1 || amigo.levantamento > 5
        ) {
          Alert.alert('Erro', 'Todos os valores devem estar entre 1 e 5.');
          return;
        }
      }

      // Monta payload conforme o fluxo
      let endpoint;
      let payload;

      if (fluxo === 'online') {
        endpoint = `/api/jogos/${jogoId}/habilidades`;
        payload = {
          habilidades: amigos.map(amigo => ({
            id_usuario: amigo.id_usuario,
            passe: amigo.passe,
            ataque: amigo.ataque,
            levantamento: amigo.levantamento,
          })),
        };
      } else {
        endpoint = `/api/habilidades/salvar-offline`;
        payload = {
          habilidades: amigos.map(amigo => ({
            id_usuario: amigo.id_usuario,
            passe: amigo.passe,
            ataque: amigo.ataque,
            levantamento: amigo.levantamento,
          })),
        };
      }

      const response = await api.post(endpoint, payload);

      if (response.status === 200) {
        Alert.alert('Sucesso', 'Habilidades atualizadas!');
        navigation.navigate('EquilibrarTimes', { fluxo });
      } else {
        Alert.alert('Erro', 'Não foi possível salvar as habilidades.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar habilidades.');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={amigos}
        keyExtractor={(item) => item.id_usuario.toString()}
        renderItem={({ item }) => (
          <View style={styles.amigoContainer}>
            <Text style={styles.amigoNome}>{item.nome}</Text>
            <TextInput
              style={styles.input}
              placeholder="Passe"
              value={item.passe?.toString()}
              onChangeText={(value) =>
                handleChangeHabilidade(item.id_usuario, 'passe', parseInt(value) || 0)
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Ataque"
              value={item.ataque?.toString()}
              onChangeText={(value) =>
                handleChangeHabilidade(item.id_usuario, 'ataque', parseInt(value) || 0)
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Levantamento"
              value={item.levantamento?.toString()}
              onChangeText={(value) =>
                handleChangeHabilidade(item.id_usuario, 'levantamento', parseInt(value) || 0)
              }
              keyboardType="numeric"
            />
          </View>
        )}
      />
      <Button title="Salvar e Prosseguir" onPress={salvarHabilidades} />
    </View>
  );
};

export default HabilidadesAmigos;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  amigoContainer: {
    marginBottom: 20,
  },
  amigoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 5,
  },
});

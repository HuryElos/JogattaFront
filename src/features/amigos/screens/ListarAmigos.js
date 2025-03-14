// src/features/amigos/screens/ListarAmigos.js

// Descrição:
// Esta tela exibe uma lista de amigos associados ao usuário logado.
// Carrega os dados do backend, validando o token do usuário, e lista os amigos com nome e e-mail.

// Relacionamentos:
// - Utiliza o serviço `listarAmigos` de `authService` para buscar os dados do backend.
// - Valida o token do usuário com `AsyncStorage` e `jwtDecode`.
// - Navega para a tela `Login` caso o token seja inválido ou ausente.

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { listarAmigos } from '../../../services/authService'; // Importa a função de serviço

const ListarAmigos = ({ navigation }) => {
  const [amigos, setAmigos] = useState([]);

  useEffect(() => {
    const fetchAmigos = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
          navigation.navigate('Login');
          return;
        }

        const decodedToken = jwtDecode(token);
        const organizador_id = decodedToken.id;
        console.log('Organizador ID recebido:', organizador_id);

        const amigosList = await listarAmigos(organizador_id);
        setAmigos(amigosList);
      } catch (error) {
        console.error('Erro ao buscar amigos:', error);
        Alert.alert('Erro', 'Sessão expirada ou inválida. Faça login novamente.');
        navigation.navigate('Login');
      }
    };

    fetchAmigos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Amigos</Text>
      <FlatList
        data={amigos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Text>{item.nome} - {item.email}</Text>}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum amigo encontrado. Convide alguns para começar a jogar!
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
});

export default ListarAmigos;

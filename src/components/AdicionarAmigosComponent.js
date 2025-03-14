// src/components/AdicionarAmigosComponent.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const AdicionarAmigosComponent = ({ navigation }) => {
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [buscaLoading, setBuscaLoading] = useState(false);
  const [erroBusca, setErroBusca] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const buscarAmigos = async () => {
        if (busca.trim().length < 2) {
          setSugestoes([]);
          setErroBusca('');
          return;
        }

        setBuscaLoading(true);
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
            navigation.navigate('Login');
            setBuscaLoading(false);
            return;
          }

          const decodedToken = jwtDecode(token);
          const organizador_id = decodedToken.id;

          const response = await api.get('/api/amigos/buscar', {
            params: {
              query: busca.trim(),
              organizador_id,
            },
          });

          setSugestoes(response.data);
          setErroBusca('');
        } catch (error) {
          console.error('Erro ao buscar amigos:', error);
          setErroBusca('Erro ao buscar amigos. Tente novamente mais tarde.');
        } finally {
          setBuscaLoading(false);
        }
      };

      buscarAmigos();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [busca]);

  const handleNavigateToProfile = (amigo) => {
    navigation.navigate('ViewProfile', { userId: amigo.id }); // Navegando para a tela de perfil
  };

  return (
    <View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.inputBusca}
          placeholder="Busque por nome ou @usuario"
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        {buscaLoading && <ActivityIndicator size="small" color="#4CAF50" />}
      </View>

      {erroBusca ? <Text style={styles.error}>{erroBusca}</Text> : null}

      {sugestoes.length > 0 && (
        <FlatList
          data={sugestoes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sugestaoItem}
              onPress={() => handleNavigateToProfile(item)} // Navegação ajustada
            >
              <Text style={styles.sugestaoNome}>{item.nome}</Text>
              <Text style={styles.sugestaoTT}>@{item.tt}</Text>
            </TouchableOpacity>
          )}
          style={styles.sugestoesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 2,
    marginBottom: 20,
  },
  inputBusca: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sugestoesList: {
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 5,
    elevation: 2,
    marginBottom: 20,
  },
  sugestaoItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  sugestaoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sugestaoTT: {
    fontSize: 14,
    color: '#777',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default AdicionarAmigosComponent;

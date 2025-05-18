import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { StackNavigationProp } from '@react-navigation/stack';
import { listarAmigos } from '../../../features/auth/services/authService';

interface Amigo {
  id: number;
  nome: string;
  email: string;
}

interface DecodedToken {
  id: number;
  // Adicione outros campos do token conforme necessário
}

type RootStackParamList = {
  ListarAmigos: undefined;
  Login: undefined;
};

type ListarAmigosScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ListarAmigos'>;

interface ListarAmigosProps {
  navigation: ListarAmigosScreenNavigationProp;
}

const ListarAmigos: React.FC<ListarAmigosProps> = ({ navigation }) => {
  const [amigos, setAmigos] = useState<Amigo[]>([]);

  useEffect(() => {
    const fetchAmigos = async (): Promise<void> => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
          navigation.navigate('Login');
          return;
        }

        const decodedToken = jwtDecode<DecodedToken>(token);
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
  }, [navigation]);

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
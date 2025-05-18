import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import api from '../../../services/api';

interface Amigo {
  id_usuario: number;
  nome: string;
  passe?: number;
  ataque?: number;
  levantamento?: number;
}

interface HabilidadePayload {
  id_usuario: number;
  passe: number;
  ataque: number;
  levantamento: number;
}

type RootStackParamList = {
  HabilidadesAmigos: {
    jogoId?: number;
    fluxo: 'online' | 'offline';
    tempPlayers?: Amigo[];
  };
  EquilibrarTimes: {
    fluxo: 'online' | 'offline';
  };
};

type HabilidadesAmigosNavigationProp = StackNavigationProp<RootStackParamList, 'HabilidadesAmigos'>;
type HabilidadesAmigosRouteProp = RouteProp<RootStackParamList, 'HabilidadesAmigos'>;

interface HabilidadesAmigosProps {
  route: HabilidadesAmigosRouteProp;
  navigation: HabilidadesAmigosNavigationProp;
}

const HabilidadesAmigos: React.FC<HabilidadesAmigosProps> = ({ route, navigation }) => {
  const { jogoId, fluxo, tempPlayers } = route.params || {};
  const [amigos, setAmigos] = useState<Amigo[]>([]);

  useEffect(() => {
    if (tempPlayers && Array.isArray(tempPlayers)) {
      setAmigos(tempPlayers);
    } else {
      const fetchHabilidades = async (): Promise<void> => {
        try {
          let response;
          if (fluxo === 'online') {
            response = await api.get<{ jogadores: Amigo[] }>(`/api/jogos/${jogoId}/habilidades`);
          } else {
            response = await api.get<{ jogadores: Amigo[] }>('/api/habilidades/offline');
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

  const handleChangeHabilidade = (id_usuario: number, field: keyof Omit<Amigo, 'id_usuario' | 'nome'>, value: number): void => {
    setAmigos((prev) =>
      prev.map((amigo) =>
        amigo.id_usuario === id_usuario ? { ...amigo, [field]: value } : amigo
      )
    );
  };

  const salvarHabilidades = async (): Promise<void> => {
    try {
      for (const amigo of amigos) {
        if (
          !amigo.passe || !amigo.ataque || !amigo.levantamento ||
          amigo.passe < 1 || amigo.passe > 5 ||
          amigo.ataque < 1 || amigo.ataque > 5 ||
          amigo.levantamento < 1 || amigo.levantamento > 5
        ) {
          Alert.alert('Erro', 'Todos os valores devem estar entre 1 e 5.');
          return;
        }
      }

      let endpoint: string;
      let payload: { habilidades: HabilidadePayload[] };

      if (fluxo === 'online') {
        endpoint = `/api/jogos/${jogoId}/habilidades`;
      } else {
        endpoint = '/api/habilidades/salvar-offline';
      }

      payload = {
        habilidades: amigos.map(amigo => ({
          id_usuario: amigo.id_usuario,
          passe: amigo.passe!,
          ataque: amigo.ataque!,
          levantamento: amigo.levantamento!,
        })),
      };

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

  const renderAmigoItem = ({ item }: { item: Amigo }): JSX.Element => (
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
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={amigos}
        keyExtractor={(item) => item.id_usuario.toString()}
        renderItem={renderAmigoItem}
      />
      <Button title="Salvar e Prosseguir" onPress={salvarHabilidades} />
    </View>
  );
};

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

export default HabilidadesAmigos; 
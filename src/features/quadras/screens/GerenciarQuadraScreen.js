// src/features/admin/screens/GerenciarQuadraScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../services/api';

export default function GerenciarQuadraScreen({ navigation, route }) {
  const { quadra } = route.params;

  // Estados para cada campo
  const [nome, setNome] = useState(quadra.nome);
  const [foto, setFoto] = useState(quadra.foto || null);
  const [precoHora, setPrecoHora] = useState(String(quadra.preco_hora || ''));
  const [promocaoAtiva, setPromocaoAtiva] = useState(!!quadra.promocao_ativa);
  const [descricaoPromocao, setDescricaoPromocao] = useState(quadra.descricao_promocao || '');
  const [redeDisponivel, setRedeDisponivel] = useState(!!quadra.rede_disponivel);
  const [bolaDisponivel, setBolaDisponivel] = useState(!!quadra.bola_disponivel);
  const [observacoes, setObservacoes] = useState(quadra.observacoes || '');

  // Função para selecionar nova foto da quadra
  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso às suas fotos para continuar.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.cancelled) {
      setFoto(result.uri);
    }
  };

  // Atualiza a quadra via PUT
  const handleUpdate = async () => {
    if (!nome.trim()) {
      return Alert.alert('Erro', 'O nome da quadra é obrigatório.');
    }

    try {
      const payload = {
        nome,
        foto,
        preco_hora: precoHora,
        promocao_ativa: promocaoAtiva,
        descricao_promocao: descricaoPromocao,
        rede_disponivel: redeDisponivel,
        bola_disponivel: bolaDisponivel,
        observacoes,
      };

      const response = await api.put(`/api/superadmin/quadras/${quadra.id_quadra}`, payload);

      if (response.status === 200) {
        Alert.alert('Sucesso', 'Quadra atualizada com sucesso.');
        navigation.goBack();
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar a quadra.');
      }
    } catch (error) {
      console.log('Erro ao atualizar quadra:', error.message);
      Alert.alert('Erro', 'Erro ao atualizar a quadra: ' + error.message);
    }
  };

  // Deleta a quadra via DELETE
  const handleDelete = async () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza de que deseja excluir esta quadra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/api/superadmin/quadras/${quadra.id_quadra}`);
              if (response.status === 200) {
                Alert.alert('Sucesso', 'Quadra deletada com sucesso.');
                navigation.goBack();
              } else {
                Alert.alert('Erro', 'Não foi possível deletar a quadra.');
              }
            } catch (error) {
              console.log('Erro ao deletar quadra:', error.message);
              Alert.alert('Erro', 'Erro ao deletar a quadra: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerenciar Quadra</Text>

      <Text style={styles.label}>Nome da Quadra *</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
      />

      {/* Botão e preview para foto da quadra */}
      <Text style={styles.label}>Foto da Quadra</Text>
      <TouchableOpacity style={styles.photoButton} onPress={handleSelectPhoto}>
        <Text style={styles.photoButtonText}>
          {foto ? 'Alterar Foto da Quadra' : 'Selecionar Foto da Quadra'}
        </Text>
      </TouchableOpacity>
      {foto && (
        <Image source={{ uri: foto }} style={styles.photoPreview} />
      )}

      <Text style={styles.label}>Preço por Hora *</Text>
      <TextInput
        style={styles.input}
        value={precoHora}
        onChangeText={setPrecoHora}
        keyboardType="numeric"
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Promoção Ativa?</Text>
        <Switch
          value={promocaoAtiva}
          onValueChange={(val) => {
            setPromocaoAtiva(val);
            if (!val) setDescricaoPromocao('');
          }}
        />
      </View>

      {promocaoAtiva && (
        <>
          <Text style={styles.label}>Descrição da Promoção</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 10% de desconto até fim do mês"
            value={descricaoPromocao}
            onChangeText={setDescricaoPromocao}
          />
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.label}>Rede Disponível?</Text>
        <Switch
          value={redeDisponivel}
          onValueChange={setRedeDisponivel}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Bola Disponível?</Text>
        <Switch
          value={bolaDisponivel}
          onValueChange={setBolaDisponivel}
        />
      </View>

      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
      />

      {/* Botão de Atualizar */}
      <TouchableOpacity style={styles.buttonUpdate} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Atualizar Quadra</Text>
      </TouchableOpacity>

      {/* Botão de Deletar */}
      <TouchableOpacity
        style={styles.buttonDelete}
        onPress={handleDelete}
      >
        <Text style={styles.buttonText}>Deletar Quadra</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
  title: {
    fontSize: 24, fontWeight: 'bold',
    marginBottom: 20, textAlign: 'center',
  },
  label: {
    fontSize: 14, fontWeight: '600',
    marginBottom: 5, marginTop: 10,
  },
  input: {
    borderWidth: 1, borderColor: '#CCC',
    borderRadius: 8, padding: 10,
    marginBottom: 5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  photoButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonUpdate: {
    backgroundColor: '#4CAF50',
    padding: 15, borderRadius: 8,
    alignItems: 'center', marginTop: 20,
  },
  buttonDelete: {
    backgroundColor: '#E74C3C',
    padding: 15, borderRadius: 8,
    alignItems: 'center', marginTop: 10,
  },
  buttonText: {
    color: '#FFF', fontSize: 16,
    fontWeight: 'bold',
  },
});

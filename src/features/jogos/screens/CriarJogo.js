// src/screens/CriarJogo.js

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';
import InputField from '../components/InputFields';
import DateTimeButton from '../components/DateTimeButton';
import useDateTime from '../hooks/useDateTime';
import { validarCampos } from '../utils/validarCampo';
import styles from '../styles/CriarJogo.styles';

const CriarJogo = ({ navigation }) => {
  const [nomeJogo, setNomeJogo] = useState('');
  const [limiteJogadores, setLimiteJogadores] = useState('');
  const [descricao, setDescricao] = useState('');
  const [chavePix, setChavePix] = useState('');

  // NOVOS CAMPOS
  const [tempoNotificacao, setTempoNotificacao] = useState('10'); // Ex.: 10 minutos antes
  const [habilitarNotificacao, setHabilitarNotificacao] = useState(true);

  const {
    data,
    horaInicio,
    horaFim,
    showDatePicker,
    showTimePicker,
    setShowDatePicker,
    setShowTimePicker,
    handleDateChange,
    handleTimeChange,
  } = useDateTime();

  const validar = useCallback(() => {
    return validarCampos({ nomeJogo, limiteJogadores, dataJogo: data, horaInicio, horaFim });
  }, [nomeJogo, limiteJogadores, data, horaInicio, horaFim]);

  const criarJogo = useCallback(async () => {
    const validacao = validar();
    if (!validacao.isValid) {
      Alert.alert('Erro', validacao.message);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado.');

      const { id } = jwtDecode(token);
      const dataFormatada = data.toISOString().split('T')[0];
      const horaInicioFormatada = horaInicio.toTimeString().slice(0, 5);
      const horaFimFormatada = horaFim.toTimeString().slice(0, 5);

      // Envia para o backend inclusive o tempoNotificacao e se habilitarNotificacao
      const response = await api.post('/api/jogos/criar', {
        nome_jogo: nomeJogo.trim(),
        data_jogo: dataFormatada,
        horario_inicio: horaInicioFormatada,
        horario_fim: horaFimFormatada,
        limite_jogadores: parseInt(limiteJogadores, 10),
        id_usuario: id,
        descricao: descricao.trim() || null,
        chave_pix: chavePix.trim() || null,
        habilitar_notificacao: habilitarNotificacao,
        tempo_notificacao: parseInt(tempoNotificacao, 10),
      });

      Alert.alert('Sucesso', 'Sala criada com sucesso!');
      navigation.navigate('LiveRoom', { id_jogo: response.data.id_jogo });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a sala. Tente novamente.');
    }
  }, [
    validar,
    nomeJogo,
    limiteJogadores,
    data,
    horaInicio,
    horaFim,
    descricao,
    chavePix,
    tempoNotificacao,
    habilitarNotificacao,
    navigation
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Ionicons
          name="basketball-outline"
          size={50}
          color="#4CAF50"
          style={styles.icon}
        />

        <InputField
          label="Nome do Jogo"
          placeholder="Ex: Torneio de Sábado"
          value={nomeJogo}
          onChangeText={setNomeJogo}
        />

        <InputField
          label="Limite de Jogadores"
          placeholder="Ex: 10"
          value={limiteJogadores}
          onChangeText={setLimiteJogadores}
          keyboardType="numeric"
        />

        <InputField
          label="Descrição (Opcional)"
          placeholder="Ex: Vôlei descontraído"
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        <InputField
          label="Chave PIX (Opcional)"
          placeholder="Ex: 12345678900"
          value={chavePix}
          onChangeText={setChavePix}
        />

        {/* NOVOS CAMPOS */}
        <InputField
          label="Tempo de Notificação (Minutos antes)"
          placeholder="Ex: 10"
          value={tempoNotificacao}
          onChangeText={setTempoNotificacao}
          keyboardType="numeric"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ marginRight: 10 }}>Habilitar Notificação Automática?</Text>
          <Switch
            value={habilitarNotificacao}
            onValueChange={setHabilitarNotificacao}
          />
        </View>
        {/* FIM NOVOS CAMPOS */}

        <View style={styles.dateTimeContainer}>
          <DateTimeButton
            label="Data do Jogo"
            value={data.toISOString().split('T')[0]}
            onPress={() => setShowDatePicker(true)}
            icon="calendar-outline"
          />

          <DateTimeButton
            label="Hora de Início"
            value={horaInicio.toTimeString().slice(0, 5)}
            onPress={() => setShowTimePicker('inicio')}
            icon="time-outline"
          />

          <DateTimeButton
            label="Hora de Fim"
            value={horaFim.toTimeString().slice(0, 5)}
            onPress={() => setShowTimePicker('fim')}
            icon="time-outline"
          />
        </View>

        <DatePickerModal
          locale="pt-BR"
          mode="single"
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          date={data}
          onConfirm={handleDateChange}
        />

        <TimePickerModal
          locale="pt-BR"
          visible={showTimePicker !== null}
          onDismiss={() => setShowTimePicker(null)}
          onConfirm={handleTimeChange}
          hours={showTimePicker === 'inicio' ? horaInicio.getHours() : horaFim.getHours()}
          minutes={showTimePicker === 'inicio' ? horaInicio.getMinutes() : horaFim.getMinutes()}
        />

        <TouchableOpacity style={styles.createButton} onPress={criarJogo}>
          <Ionicons name="checkmark-done" size={20} color="#FFF" style={styles.createButtonIcon} />
          <Text style={styles.createButtonText}>Criar Sala</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CriarJogo;

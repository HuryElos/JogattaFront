// src/features/jogo/screens/JogoScreen.js

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, FlatList, ActivityIndicator, Text, TouchableOpacity, Alert, ScrollView, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import JogadorItem from '../components/JogadorItem';
import ModalHabilidades from '../components/ModalHabilidades';
import TimeSelector from '../components/TimeSelector';
import EquilibrarButton from '../components/EquilibrarButton';

import useFetchJogadores from '../hooks/useFetchJogadores';
import useOrganizadorId from '../hooks/useOrganizadorId';

import api from '../../../services/api';
import styles from '../styles/JogoScreen.styles';

import TutorialOverlay from '../components/TutorialOverlay';

const JogoScreen = ({ route, navigation }) => {
  const timeSelectorRef = useRef();
  const levantadorSwitchRef = useRef();
  const editButtonRef = useRef();

  const { jogoId, amigosSelecionados = [], fluxo = 'offline', tempPlayers } = route.params || {};
  // Caso venham jogadores temporários, usamos estes; senão, os selecionados
  const effectiveAmigosSelecionados = tempPlayers && tempPlayers.length > 0 ? tempPlayers : amigosSelecionados;

  const { organizador_id, loading: loadingOrganizador } = useOrganizadorId();

  // Padroniza os dados para garantir que a propriedade de identificação seja "id_usuario"
  const memoizedAmigosSelecionados = useMemo(() => {
    return effectiveAmigosSelecionados.map(amigo => ({
      ...amigo,
      id_usuario: amigo.id_usuario || amigo.id,
    }));
  }, [effectiveAmigosSelecionados]);

  const { jogadores, setJogadores, loading: loadingJogadores } = useFetchJogadores(
    organizador_id,
    memoizedAmigosSelecionados,
    fluxo
  );

  // Tamanho do time padrão é 6 (sexteto)
  const [tamanhoTime, setTamanhoTime] = useState(6);
  const [habilidadesModal, setHabilidadesModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [limitErrorId, setLimitErrorId] = useState(null);
  const [showSetterModal, setShowSetterModal] = useState(false);

  useEffect(() => {
    if (limitErrorId) {
      const timer = setTimeout(() => setLimitErrorId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [limitErrorId]);

  const idJogoParaEnvio = jogoId || null;

  useEffect(() => {
    console.log('Jogadores Recebidos (JogoScreen):', jogadores);
  }, [jogadores]);

  const abrirModalHabilidades = useCallback((jogador) => {
    if (!jogador?.id_usuario) return;
    setHabilidadesModal({
      ...jogador,
      // Usa a propriedade padronizada "nome"
      nome: jogador.nome?.trim() !== '' ? jogador.nome : `Jogador Temporário ${jogador.id_usuario}`,
      passe: jogador.passe || 3,
      ataque: jogador.ataque || 3,
      levantamento: jogador.levantamento || 3,
    });
  }, []);

  const salvarHabilidades = useCallback((atributo, valor) => {
    if (!habilidadesModal) return;
    setHabilidadesModal((prev) => ({
      ...prev,
      [atributo.toLowerCase()]: valor,
    }));
  }, [habilidadesModal]);

  const confirmarSalvarHabilidades = useCallback(async () => {
    if (!habilidadesModal) return;
    const { id_usuario, passe, ataque, levantamento, nome } = habilidadesModal;
    // Validação básica para os atributos
    if ([passe, ataque, levantamento].some(num => isNaN(num) || num < 1 || num > 5)) {
      return;
    }
    const numericUsuarioId =
      typeof id_usuario === 'string' && id_usuario.startsWith('temp-')
        ? parseInt(id_usuario.replace('temp-', '')) * -1
        : id_usuario;
    try {
      const payload = {
        organizador_id,
        usuario_id: numericUsuarioId,
        passe,
        ataque,
        levantamento,
      };
      if (idJogoParaEnvio) {
        payload.id_jogo = idJogoParaEnvio;
      }
      await api.post('/api/avaliacoes/salvar', payload);
      setJogadores((prev) =>
        prev.map(j =>
          j.id_usuario === id_usuario
            ? {
                ...j,
                passe: passe || 3,
                ataque: ataque || 3,
                levantamento: levantamento || 3,
                // Garante que o nome está padronizado
                nome: nome?.trim() || j.nome || `Jogador Temporário ${id_usuario}`,
                temporario: j.temporario ?? false,
              }
            : j
        )
      );
      setHabilidadesModal(null);
    } catch (error) {
      console.error('Erro ao salvar habilidades:', error);
    }
  }, [habilidadesModal, organizador_id, idJogoParaEnvio, setJogadores]);

  const equilibrarTimes = useCallback(async () => {
    if (jogadores.length < tamanhoTime * 2) {
      Alert.alert('Atenção', 'Não há jogadores suficientes para equilibrar os times.');
      return;
    }
    setLoading(true);
    try {
      // Primeiro, criar um novo jogo se não houver um id_jogo
      let jogoIdParaEnvio = idJogoParaEnvio;
      if (!jogoIdParaEnvio) {
        const criarJogoResponse = await api.post('/api/jogos/criar', {
          organizador_id,
          nome_jogo: 'Jogo Automático',
          data_jogo: new Date().toISOString(),
          horario_inicio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          horario_fim: new Date(new Date().setHours(new Date().getHours() + 2)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          limite_jogadores: jogadores.length,
          id_usuario: organizador_id,
          descricao: 'Jogo criado automaticamente para equilíbrio de times',
          chave_pix: '',
          habilitar_notificacao: false,
          tempo_notificacao: 30,
          status: 'aberto',
          fluxo: fluxo
        });
        jogoIdParaEnvio = criarJogoResponse.data.id_jogo;
      }

      // Garante que todos os jogadores tenham valores numéricos válidos
      const jogadoresProntos = jogadores.map(jogador => {
        const numericUsuarioId = typeof jogador.id_usuario === 'string' && jogador.id_usuario.startsWith('temp-')
          ? parseInt(jogador.id_usuario.replace('temp-', '')) * -1
          : jogador.id_usuario;

        return {
          id_usuario: numericUsuarioId,
          passe: parseInt(jogador.passe) || 3,
          ataque: parseInt(jogador.ataque) || 3,
          levantamento: parseInt(jogador.levantamento) || 3,
          nome: jogador.nome?.trim() || `Jogador Temporário ${numericUsuarioId}`,
          isLevantador: Boolean(jogador.isLevantador),
          genero: jogador.genero || 'M',
          temporario: Boolean(jogador.temporario)
        };
      });

      // Log para debug
      console.log('Payload sendo enviado:', {
        id_jogo: jogoIdParaEnvio,
        tamanho_time: tamanhoTime,
        amigos_offline: jogadoresProntos,
        fluxo: fluxo
      });

      const payload = {
        id_jogo: jogoIdParaEnvio,
        tamanho_time: tamanhoTime,
        amigos_offline: jogadoresProntos,
        fluxo: fluxo
      };

      const response = await api.post('/api/balanceamento/iniciar-balanceamento', payload);
      
      if (!response.data?.error) {
        const times = response.data.times || [];
        const reservas = response.data.reservas || [];
        navigation.navigate('TimesBalanceados', {
          id_jogo: jogoIdParaEnvio,
          id_usuario_organizador: organizador_id,
          tamanho_time: tamanhoTime,
          times,
          reservas,
          fluxo,
          rotacoes: response.data.rotacoes || [],
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Erro ao equilibrar os times:', error);
      let mensagemErro = 'Não foi possível equilibrar os times. ';
      
      if (error.response?.data?.message) {
        mensagemErro += error.response.data.message;
      } else if (error.message) {
        mensagemErro += error.message;
      } else {
        mensagemErro += 'Por favor, tente novamente.';
      }

      Alert.alert('Erro', mensagemErro);
    } finally {
      setLoading(false);
    }
  }, [jogadores, tamanhoTime, organizador_id, idJogoParaEnvio, navigation, fluxo]);

  const handleOpenSetterModal = () => {
    if (jogadores.length < tamanhoTime * 2) {
      Alert.alert('Atenção', 'Não há jogadores suficientes para definir levantadores.');
      return;
    }
    setShowSetterModal(true);
  };

  const handleCloseSetterModal = () => setShowSetterModal(false);

  const handleToggleLevantador = useCallback(
    (playerId) => {
      const player = jogadores.find(j => j.id_usuario === playerId);
      if (!player) return;

      const currentSetters = jogadores.filter(j => j.isLevantador).length;
      const maxSetters = Math.floor(jogadores.length / tamanhoTime);

      if (!player.isLevantador && currentSetters >= maxSetters) {
        setLimitErrorId(playerId);
        return;
      }

      setJogadores(prev =>
        prev.map(j =>
          j.id_usuario === playerId
            ? { ...j, isLevantador: !j.isLevantador }
            : j
        )
      );
    },
    [jogadores, tamanhoTime, setJogadores]
  );

  // Ao mudar o tamanho do time, reseta a flag isLevantador para todos
  useEffect(() => {
    setJogadores(prev =>
      prev.map(jogador => ({
        ...jogador,
        isLevantador: false,
      }))
    );
  }, [tamanhoTime, setJogadores]);

  const renderJogador = useCallback(
    ({ item }) => (
      <View style={styles.jogadorItem}>
        <View style={styles.jogadorInfo}>
          <Text style={styles.jogadorNome}>{item.nome}</Text>
          <View style={[
            styles.genderBadge,
            { backgroundColor: item.genero === 'M' ? '#4A90E2' : '#E91E63' }
          ]}>
            <Text style={styles.genderText}>{item.genero}</Text>
          </View>
        </View>
        <View style={styles.jogadorActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => abrirModalHabilidades(item)}
          >
            <Ionicons name="pencil" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => {
              // Implemente a lógica para remover o jogador, se necessário
            }}
          >
            <Ionicons name="trash" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [abrirModalHabilidades]
  );

  const currentSetters = jogadores.filter(j => j.isLevantador).length;
  const maxSetters = tamanhoTime > 0 ? Math.floor(jogadores.length / tamanhoTime) : 0;
  const totalJogadores = jogadores.length;

  return (
    <View style={styles.container}>
      {/* Seletor de tamanho de time */}
      <View style={styles.timeSelectorContainer} ref={timeSelectorRef}>
        <TimeSelector
          tamanhoTime={tamanhoTime}
          setTamanhoTime={setTamanhoTime}
          options={[2, 3, 4, 5, 6]}
          totalJogadores={totalJogadores}
          currentSetters={currentSetters}
          maxSetters={maxSetters}
        />
      </View>

      {/* Lista de jogadores ou indicador de carregamento */}
      {(loadingOrganizador || loadingJogadores || loading) ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jogadores}
          keyExtractor={item => item.id_usuario ? `${item.id_usuario}` : Math.random().toString()}
          renderItem={({ item }) => (
            <JogadorItem
              jogador={item}
              abrirModal={abrirModalHabilidades}
              isLevantador={item.isLevantador}
              onToggleLevantador={() => handleToggleLevantador(item.id_usuario)}
              refEditButton={editButtonRef}
              refSwitch={levantadorSwitchRef}
              limitError={limitErrorId === item.id_usuario}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum jogador encontrado.</Text>}
          contentContainerStyle={styles.playersList}
        />
      )}

      <View style={{ marginTop: 16 }}>
        <EquilibrarButton
          onPress={equilibrarTimes}
          disabled={loading || jogadores.length < tamanhoTime * 2}
          mode={jogadores.some(j => j.isLevantador) ? 'levantadores' : undefined}
        />
      </View>

      {/* Modal de Habilidades */}
      {habilidadesModal && (
        <ModalHabilidades
          jogador={habilidadesModal}
          onClose={() => setHabilidadesModal(null)}
          atualizarHabilidades={salvarHabilidades}
          confirmarSalvarHabilidades={confirmarSalvarHabilidades}
        />
      )}

      {/* Modal de Levantadores */}
      <Modal
        visible={showSetterModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSetterModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '60%' }]}>
            <Text style={styles.modalTitle}>Levantadores</Text>
            <ScrollView style={{ maxHeight: 200, width: '100%' }}>
              {jogadores.map((player) => {
                const isLev = player.isLevantador;
                return (
                  <TouchableOpacity
                    key={player.id_usuario}
                    style={styles.levRow}
                    onPress={() => handleToggleLevantador(player.id_usuario)}
                  >
                    <Ionicons
                      name={isLev ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isLev ? '#4CAF50' : '#ccc'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 16, color: '#333' }}>{player.nome}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#999' }]}
                onPress={handleCloseSetterModal}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Overlay de tutorial, se necessário */}
      <TutorialOverlay
        targetRefs={{
          timeSelector: timeSelectorRef,
          levantadorSwitch: levantadorSwitchRef,
          editButton: editButtonRef,
        }}
        steps={[
          {
            target: 'timeSelector',
            title: 'Selecione o tamanho do time',
            description: 'Escolha quantos jogadores cada time terá',
            position: 'bottom'
          },
          {
            target: 'editButton',
            title: 'Defina as habilidades',
            description: 'Clique no ícone de lápis para definir as habilidades de cada jogador',
            position: 'left'
          },
          {
            target: 'levantadorSwitch',
            title: 'Marque os levantadores',
            description: 'Use o switch para marcar quem será levantador',
            position: 'right'
          }
        ]}
      />
    </View>
  );
};

export default JogoScreen;

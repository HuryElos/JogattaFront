// src/features/jogo/screens/JogoScreen.js

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, FlatList, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
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
      return;
    }
    setLoading(true);
    try {
      const jogadoresProntos = jogadores.map(jogador => ({
        id_usuario: jogador.id_usuario || null,
        passe: jogador.passe || 3,
        ataque: jogador.ataque || 3,
        levantamento: jogador.levantamento || 3,
        nome: jogador.nome?.trim() || `Jogador Temporário ${jogador.id_usuario || jogador.id}`,
        isLevantador: jogador.isLevantador || false,
        genero: jogador.genero  // adicionado aqui!
      }));
      const payload = {
        id_jogo: idJogoParaEnvio,
        tamanho_time: tamanhoTime,
        amigos_offline: jogadoresProntos,
      };
      const response = await api.post('/api/balanceamento/iniciar-balanceamento', payload);
      if (!response.data?.error) {
        const times = response.data.times || [];
        const reservas = response.data.reservas || [];
        navigation.navigate('TimesBalanceados', {
          id_jogo: idJogoParaEnvio,
          id_usuario_organizador: organizador_id,
          tamanho_time: tamanhoTime,
          times,
          reservas,
          fluxo,
          rotacoes: response.data.rotacoes || [],
        });
      }
    } catch (error) {
      console.error('Erro ao equilibrar os times:', error);
    } finally {
      setLoading(false);
    }
  }, [jogadores, tamanhoTime, organizador_id, idJogoParaEnvio, navigation]);

  const handleToggleLevantador = useCallback(
    (player, newValue) => {
      if (newValue) {
        const maxSetters = tamanhoTime > 0 ? Math.floor(jogadores.length / tamanhoTime) : 0;
        const currentSetters = jogadores.filter(j => j.isLevantador).length;
        if (currentSetters >= maxSetters) {
          setLimitErrorId(player.id_usuario);
          return;
        }
      }
      setJogadores(prev =>
        prev.map(j => j.id_usuario === player.id_usuario ? { ...j, isLevantador: newValue } : j)
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
          renderItem={renderJogador}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum jogador encontrado.</Text>}
          contentContainerStyle={styles.playersList}
        />
      )}
      <View style={{ marginTop: 16 }}>
        <EquilibrarButton
          onPress={equilibrarTimes}
          disabled={loading || jogadores.length < tamanhoTime * 2}
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
      {/* Overlay de tutorial, se necessário */}
      <TutorialOverlay
        targetRefs={{
          timeSelector: timeSelectorRef,
          levantadorSwitch: levantadorSwitchRef,
          editButton: editButtonRef,
        }}
      />
    </View>
  );
};

export default JogoScreen;

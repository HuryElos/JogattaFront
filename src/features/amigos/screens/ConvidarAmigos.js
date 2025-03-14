// src/features/amigos/screens/ConvidarAmigos.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Modais
import CriarGrupoModal from '../components/modals/CriarGrupoModal';
import CriarJogadorModal from '../components/modals/CriarJogadorModal';

// Componentes / Hooks
import SearchBar from '../components/SearchBar';
import useToggleSelecionado from '../hooks/useToggleSelecionado';
import useAmigos from '../hooks/useAmigos';
import GrupoList from '../components/GrupoList';
import AmigosList from '../components/AmigosList';
import ActionsFooter from '../components/ActionsFooter';
import api from '../../../services/api';

const ConvidarAmigos = ({ navigation, route }) => {
  const fluxo = route.params?.fluxo || 'offline';

  // -------------------------------
  // STATES GERAIS
  // -------------------------------
  const [novoAmigoNome, setNovoAmigoNome] = useState('');
  const [modalCriarVisible, setModalCriarVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalAddAmigoVisible, setModalAddAmigoVisible] = useState(false);

  const [novoGrupo, setNovoGrupo] = useState('');
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [nomeEditando, setNomeEditando] = useState('');
  const [membrosEditando, setMembrosEditando] = useState([]);
  const [searchMembroTerm, setSearchMembroTerm] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Filtro: "amigos", "temporarios", "grupos", "lista"
  const [filtro, setFiltro] = useState('amigos');

  // -------------------------------
  // STATES PARA O FLUXO "LISTA"
  // -------------------------------
  const [listaPlayers, setListaPlayers] = useState([]);
  const [showListaModal, setShowListaModal] = useState(false);
  const [listaPastedText, setListaPastedText] = useState('');
  const [listaParsedPlayers, setListaParsedPlayers] = useState([]);

  // -------------------------------
  // HOOKS
  // -------------------------------
  const { selecionados, toggleSelecionado, setSelecionados } = useToggleSelecionado();
  const {
    amigos,
    amigosAll,
    grupos,
    isLoading,
    carregarDadosIniciais,
    filtrarAmigos,
    criarAmigoTemporario,
    criarGrupo,
  } = useAmigos(navigation);

  // -------------------------------
  // CARREGAMENTO INICIAL
  // -------------------------------
  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarDadosIniciais();
    setRefreshing(false);
  }, [carregarDadosIniciais]);

  useEffect(() => {
    filtrarAmigos(searchTerm);
  }, [searchTerm, filtrarAmigos]);

  // -------------------------------
  // LISTA DE AMIGOS DE EXIBIÇÃO
  // -------------------------------
  const listaAmigosExibicao = useMemo(() => {
    if (filtro === 'amigos') {
      return amigos.filter((a) => !a.temporario);
    } else if (filtro === 'temporarios') {
      return amigos.filter((a) => a.temporario && a.nome);
    } else if (filtro === 'lista') {
      return listaPlayers;
    } else {
      return [];
    }
  }, [filtro, amigos, listaPlayers]);

  // -------------------------------
  // CRIAR JOGADOR TEMPORÁRIO
  // -------------------------------
  const handleCriarJogadorTemporario = useCallback(async () => {
    try {
      await criarAmigoTemporario(novoAmigoNome, fluxo);
      setNovoAmigoNome('');
      setModalAddAmigoVisible(false);
      Alert.alert('Sucesso', 'Jogador temporário criado!');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }, [novoAmigoNome, criarAmigoTemporario, fluxo]);

  // -------------------------------
  // CRIAR GRUPO
  // -------------------------------
  const handleCriarGrupo = useCallback(async () => {
    if (!novoGrupo.trim()) {
      Alert.alert('Erro', 'O nome do grupo não pode estar vazio.');
      return;
    }
    const amigosSelecionadosIDs = selecionados
      .filter((s) => s.tipo === 'amigo')
      .map((s) => {
        const item = amigosAll.find((a) => a.id === s.id);
        return item?.id_usuario ?? item?.id;
      });
    if (!amigosSelecionadosIDs.length) {
      Alert.alert('Atenção', 'Selecione pelo menos um amigo para criar um grupo.');
      return;
    }
    try {
      await criarGrupo(novoGrupo, amigosSelecionadosIDs);
      setModalCriarVisible(false);
      setNovoGrupo('');
      setSelecionados([]);
    } catch (error) {
      Alert.alert('Erro ao criar grupo', error.message);
    }
  }, [novoGrupo, selecionados, criarGrupo, amigosAll, setSelecionados]);

  // -------------------------------
  // EXCLUIR GRUPOS SELECIONADOS
  // -------------------------------
  const excluirGruposSelecionados = useCallback(async () => {
    const gruposSelecionados = selecionados.filter((s) => s.tipo === 'grupo');
    if (!gruposSelecionados.length) {
      return Alert.alert('Atenção', 'Nenhum grupo selecionado para exclusão.');
    }
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir todos os grupos selecionados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const sel of gruposSelecionados) {
                await api.delete(`/api/groups/excluir/${sel.id}`);
              }
              await carregarDadosIniciais();
              setSelecionados((prev) =>
                prev.filter(
                  (s) => s.tipo !== 'grupo' || !gruposSelecionados.some((g) => g.id === s.id)
                )
              );
              Alert.alert('Sucesso', 'Grupos selecionados excluídos.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir todos os grupos.');
            }
          },
        },
      ]
    );
  }, [selecionados, carregarDadosIniciais, setSelecionados]);

  // -------------------------------
  // EXCLUIR GRUPO INDIVIDUAL
  // -------------------------------
  const confirmarExcluirGrupo = useCallback(
    (idGrupo, nomeGrupo) => {
      Alert.alert('Confirmar Exclusão', `Deseja excluir o grupo "${nomeGrupo}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/groups/excluir/${idGrupo}`);
              await carregarDadosIniciais();
              setSelecionados((prev) =>
                prev.filter((s) => !(s.tipo === 'grupo' && s.id === idGrupo))
              );
              Alert.alert('Sucesso', 'Grupo excluído.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o grupo.');
            }
          },
        },
      ]);
    },
    [carregarDadosIniciais, setSelecionados]
  );

  // -------------------------------
  // EDITAR GRUPO
  // -------------------------------
  const abrirEditarGrupo = useCallback((grupo) => {
    setGrupoEditando(grupo);
    setNomeEditando(grupo.nome_grupo);
    setMembrosEditando(grupo.membros.map((m) => m.id));
    setSearchMembroTerm('');
    setModalEditarVisible(true);
  }, []);

  const salvarEdicaoGrupo = useCallback(async () => {
    if (!nomeEditando.trim()) {
      return Alert.alert('Erro', 'O nome do grupo não pode estar vazio.');
    }
    try {
      await api.put(`/api/groups/editar/${grupoEditando.id_grupo}`, {
        nome_grupo: nomeEditando,
        membros: membrosEditando,
      });
      Alert.alert('Sucesso', 'Grupo atualizado.');
      setModalEditarVisible(false);
      setGrupoEditando(null);
      setNomeEditando('');
      setMembrosEditando([]);
      await carregarDadosIniciais();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar o grupo.');
    }
  }, [nomeEditando, membrosEditando, grupoEditando, carregarDadosIniciais]);

  const amigosFiltradosModal = useMemo(() => {
    const term = searchMembroTerm.toLowerCase().trim();
    if (!term) return amigosAll;
    return amigosAll.filter((a) => a.nome.toLowerCase().includes(term));
  }, [amigosAll, searchMembroTerm]);

  // -------------------------------
  // IR PARA TELA DE JOGO
  // -------------------------------
  const irParaTelaDeJogo = useCallback(() => {
    if (!selecionados.length) {
      Alert.alert('Atenção', 'Selecione pelo menos um amigo ou grupo.');
      return;
    }

    let jogadoresSelecionados = [];

    // Monta lista de jogadores
    selecionados.forEach((sel) => {
      if (sel.tipo === 'amigo') {
        let a = amigosAll.find((x) => x.id === sel.id);
        if (!a) {
          a = listaPlayers.find((x) => x.id_usuario === sel.id);
        }
        if (a) {
          jogadoresSelecionados.push(a);
        }
      } else if (sel.tipo === 'grupo') {
        const g = grupos.find((x) => x.id_grupo === sel.id);
        if (g) {
          jogadoresSelecionados = jogadoresSelecionados.concat(g.membros);
        }
      }
    });

    // Remove duplicados
    jogadoresSelecionados = jogadoresSelecionados.filter(
      (v, i, arr) =>
        arr.findIndex((t) => (t.id || t.id_usuario) === (v.id || v.id_usuario)) === i
    );

    if (fluxo === 'manual2') {
      navigation.navigate('ManualJogoTwoPagesScreen', {
        amigosSelecionados: jogadoresSelecionados,
        fluxo,
      });
    } else if (fluxo === 'manual') {
      navigation.navigate('ManualJogoScreen', {
        players: jogadoresSelecionados,
        fluxo,
      });
    } else if (fluxo === 'habilidades' || fluxo === 'automatico' || fluxo === 'offline') {
      navigation.navigate('Equilibrar Times', {
        screen: 'JogoScreen',
        params: {
          amigosSelecionados: jogadoresSelecionados,
          fluxo,
        },
      });
    } else {
      navigation.navigate('CriarJogo', {
        amigosSelecionados: jogadoresSelecionados,
        fluxo,
      });
    }
  }, [selecionados, amigosAll, grupos, listaPlayers, navigation, fluxo]);

  // -------------------------------
  // FUNÇÕES PARA O FLUXO "LISTA"
  // -------------------------------
  const parseLista = (text) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && (line.includes('✅') || line.includes('💰')))
      .map((line) => {
        let name = line.replace(/^[\d\s\-\.\)\:]+/, '');
        name = name.replace(/✅/g, '').replace(/💰/g, '');
        return name.trim();
      })
      .filter((name) => name.length > 0);
  };

  const handleProcessLista = () => {
    const players = parseLista(listaPastedText);
    if (players.length === 0) {
      Alert.alert('Atenção', 'Nenhum jogador confirmado foi encontrado na lista.');
      return;
    }
    setListaParsedPlayers(players);
  };

  const handleConfirmLista = () => {
    const tempPlayers = listaParsedPlayers.map((name, index) => ({
      id_usuario: -(index + 1000),
      nome: name,
      temporario: true,
    }));
    setListaPlayers(tempPlayers);
    const novosSelecionados = tempPlayers.map((p) => ({ tipo: 'amigo', id: p.id_usuario }));
    setSelecionados((prev) => [...prev, ...novosSelecionados]);
    setShowListaModal(false);
    setListaPastedText('');
    setListaParsedPlayers([]);
  };

  const handleLimparLista = () => {
    setListaPlayers([]);
    setSelecionados((prev) => prev.filter((sel) => !(sel.tipo === 'amigo' && sel.id < 0)));
  };

  const showInfoLista = () => {
    Alert.alert(
      'Como usar o Colar Lista',
      `• Cole a lista exatamente como recebida, incluindo numeração, cabeçalhos e emojis.\n\n` +
        `• Qualquer linha que contenha os emojis ✅ ou 💰 será considerada confirmada.\n\n` +
        `• Informações extras serão ignoradas.\n\nExemplo:\n  1- Maria ✅\n  2- Pedro 💰\n  3- Nabia ✅`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* MODAL: CRIAR NOVO GRUPO */}
      <CriarGrupoModal
        visible={modalCriarVisible}
        onClose={() => setModalCriarVisible(false)}
        onCreate={handleCriarGrupo}
        novoGrupo={novoGrupo}
        setNovoGrupo={setNovoGrupo}
      />

      {/* MODAL: EDITAR GRUPO */}
      <Modal
        animationType="slide"
        transparent
        visible={modalEditarVisible}
        onRequestClose={() => setModalEditarVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Editar Grupo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do grupo"
              value={nomeEditando}
              onChangeText={setNomeEditando}
            />
            <Text style={styles.subTitle}>Pesquisar Membros:</Text>
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Digite para filtrar..."
              value={searchMembroTerm}
              onChangeText={setSearchMembroTerm}
            />
            <Text style={styles.subTitle}>Selecionar Membros:</Text>
            <ScrollView style={styles.scroll}>
              {amigosFiltradosModal.map((amigo) => {
                const isSelected = membrosEditando.includes(amigo.id);
                return (
                  <TouchableOpacity
                    key={amigo.id}
                    style={styles.memItem}
                    onPress={() => {
                      setMembrosEditando((prev) =>
                        isSelected
                          ? prev.filter((i) => i !== amigo.id)
                          : [...prev, amigo.id]
                      );
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? '#333' : '#999'}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.memNome}>
                      {amigo.nome || 'Jogador Temporário'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: '#DDD' }]}
                onPress={() => setModalEditarVisible(false)}
              >
                <Text style={styles.btnModalText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnModal, { backgroundColor: '#CCC' }]}
                onPress={salvarEdicaoGrupo}
              >
                <Text style={styles.btnModalText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: CRIAR JOGADOR TEMPORÁRIO */}
      <CriarJogadorModal
        visible={modalAddAmigoVisible}
        onClose={() => setModalAddAmigoVisible(false)}
        onCreate={handleCriarJogadorTemporario}
        novoAmigoNome={novoAmigoNome}
        setNovoAmigoNome={setNovoAmigoNome}
      />

      {/* MODAL: Colar Lista (fluxo "Lista") */}
      <Modal
        animationType="slide"
        transparent
        visible={showListaModal}
        onRequestClose={() => {
          setListaParsedPlayers([]);
          setListaPastedText('');
          setShowListaModal(false);
        }}
      >
        <View style={styles.modalBg}>
          <View style={wireModalStyles.modalContainer}>
            <Text style={wireModalStyles.modalTitle}>Colar Lista de Vôlei</Text>
            {listaParsedPlayers.length === 0 ? (
              <>
                <TextInput
                  style={wireModalStyles.textArea}
                  multiline
                  placeholder="Cole a lista de vôlei aqui..."
                  value={listaPastedText}
                  onChangeText={setListaPastedText}
                />
                <TouchableOpacity style={wireModalStyles.processButton} onPress={handleProcessLista}>
                  <Text style={wireModalStyles.buttonText}>Processar Lista</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={wireModalStyles.subTitle}>Jogadores Confirmados:</Text>
                <FlatList
                  data={listaParsedPlayers}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => <Text style={wireModalStyles.listaItemText}>- {item}</Text>}
                />
                <TouchableOpacity style={wireModalStyles.confirmButton} onPress={handleConfirmLista}>
                  <Text style={wireModalStyles.buttonText}>Confirmar Jogadores</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={wireModalStyles.closeButton}
              onPress={() => {
                setListaParsedPlayers([]);
                setListaPastedText('');
                setShowListaModal(false);
              }}
            >
              <Text style={wireModalStyles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Convidar Amigos</Text>
        {isLoading && <ActivityIndicator size="small" color="#333" />}
      </View>

      {/* BARRA DE PESQUISA */}
      <SearchBar
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Digite para filtrar em tempo real..."
      />

      {/* TOGGLE DE FILTRO */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, filtro === 'amigos' && styles.toggleBtnActive]}
          onPress={() => setFiltro('amigos')}
        >
          <Text style={styles.toggleBtnText}>Amigos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, filtro === 'temporarios' && styles.toggleBtnActive]}
          onPress={() => setFiltro('temporarios')}
        >
          <Text style={styles.toggleBtnText}>Temporários</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, filtro === 'grupos' && styles.toggleBtnActive]}
          onPress={() => setFiltro('grupos')}
        >
          <Text style={styles.toggleBtnText}>Grupos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, filtro === 'lista' && styles.toggleBtnActive]}
          onPress={() => setFiltro('lista')}
        >
          <Text style={styles.toggleBtnText}>Lista</Text>
          <TouchableOpacity onPress={showInfoLista} style={styles.infoIcon}>
            <Ionicons name="information-circle-outline" size={16} color="#333" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* RENDERIZAÇÃO CONFORME O FILTRO */}
      {filtro === 'grupos' ? (
        <GrupoList
          grupos={grupos}
          selecionados={selecionados}
          toggleSelecionado={toggleSelecionado}
          onEdit={abrirEditarGrupo}
          onDelete={confirmarExcluirGrupo}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onDeleteSelected={excluirGruposSelecionados}
          fluxo={fluxo}
        />
      ) : filtro === 'lista' ? (
        <View style={styles.listaContainer}>
          {listaPlayers.length === 0 ? (
            <TouchableOpacity style={styles.listaButton} onPress={() => setShowListaModal(true)}>
              <Ionicons name="clipboard-outline" size={20} color="#333" />
              <Text style={styles.listaButtonText}>Colar Lista</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.listaHeader}>
                Total confirmados: {listaPlayers.length}
              </Text>
              <FlatList
                data={listaPlayers}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.listaItem}>
                    <Text style={styles.listaItemText}>
                      {index + 1}. {item.nome}
                    </Text>
                  </View>
                )}
              />
              <TouchableOpacity style={styles.clearButton} onPress={handleLimparLista}>
                <Text style={styles.clearButtonText}>Limpar Lista</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <AmigosList
          amigos={listaAmigosExibicao}
          selecionados={selecionados}
          toggleSelecionado={toggleSelecionado}
          onRefresh={onRefresh}
          refreshing={refreshing}
          fluxo={fluxo}
        />
      )}

      {/* RODAPÉ (ACTIONS) */}
      <ActionsFooter
        onNovoGrupo={() => setModalCriarVisible(true)}
        onTemporario={() => setModalAddAmigoVisible(true)}
        onIniciarJogo={irParaTelaDeJogo}
        isDisabled={!selecionados.length}
      />
    </View>
  );
};

export default ConvidarAmigos;

/** 
 * Estilos em “wireframe básico”:
 * apenas bordas e cores neutras, sem sombras fortes ou tons vibrantes.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerContainer: {
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  toggleBtnActive: {
    backgroundColor: '#DDD',
  },
  toggleBtnText: {
    fontSize: 12,
    color: '#333',
  },
  infoIcon: {
    marginLeft: 4,
  },
  listaContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 8,
    justifyContent: 'center',
  },
  listaButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#333',
  },
  listaHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  listaItem: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 4,
    padding: 8,
    marginBottom: 4,
  },
  listaItemText: {
    fontSize: 12,
    color: '#333',
  },
  clearButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    fontSize: 12,
    color: '#333',
  },
  scroll: {
    maxHeight: 150,
    width: '100%',
    marginBottom: 8,
  },
  memItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  memNome: {
    fontSize: 12,
    color: '#333',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btnModal: {
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
  },
  btnModalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

/**
 * Estilos do modal “Colar Lista”
 */
const wireModalStyles = StyleSheet.create({
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    minHeight: 100,
    padding: 8,
    marginBottom: 10,
    fontSize: 12,
    color: '#333',
    textAlignVertical: 'top',
  },
  processButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  confirmButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 8,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    color: '#333',
  },
  listaItemText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GameInviteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { inviteId } = route.params;

  const [loading, setLoading] = useState(true);
  const [gameDetails, setGameDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInviteDetails();
  }, [inviteId]);

  const loadInviteDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/lobby/invite/${inviteId}`);
      if (response.data) {
        setGameDetails(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do convite:', error);
      setError('Convite inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    try {
      await api.post('/api/lobby/entrar', {
        convite_uuid: inviteId,
        id_usuario: gameDetails.id_usuario_convidado
      });

      Alert.alert(
        'Sucesso',
        'Você entrou na sala com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('LiveRoom', { id_jogo: gameDetails.id_jogo })
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      Alert.alert('Erro', 'Não foi possível aceitar o convite. Tente novamente.');
    }
  };

  const handleDeclineInvite = async () => {
    try {
      await api.post('/api/lobby/convites/recusar', {
        convite_uuid: inviteId
      });

      Alert.alert(
        'Convite Recusado',
        'Você recusou o convite com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao recusar convite:', error);
      Alert.alert('Erro', 'Não foi possível recusar o convite. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Carregando convite...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B00" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Convite para Jogo</Text>
          <Text style={styles.subtitle}>
            {gameDetails?.organizador_nome} te convidou para jogar!
          </Text>
        </View>

        <View style={styles.gameInfoCard}>
          <View style={styles.gameInfoSection}>
            <Text style={styles.gameName}>{gameDetails?.nome_jogo}</Text>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {gameDetails?.horario_inicio?.substring(0, 5)} - {gameDetails?.horario_fim?.substring(0, 5)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={20} color="#666" />
              <Text style={styles.infoText}>
                {format(new Date(gameDetails?.data_jogo), "dd 'de' MMMM", { locale: ptBR })}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
              <Text style={styles.infoText}>{gameDetails?.local}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color="#666" />
              <Text style={styles.infoText}>
                {gameDetails?.jogadores_confirmados}/{gameDetails?.limite_jogadores} jogadores
              </Text>
            </View>
          </View>

          {gameDetails?.descricao && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Sobre o jogo</Text>
              <Text style={styles.descriptionText}>{gameDetails.descricao}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAcceptInvite}
          >
            <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Aceitar Convite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDeclineInvite}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Recusar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    backgroundColor: '#FF6B00',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  gameInfoCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameInfoSection: {
    marginBottom: 16,
  },
  gameName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GameInviteScreen; 
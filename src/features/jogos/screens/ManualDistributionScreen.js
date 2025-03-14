// src/features/jogo/screens/ManualDistributionScreen.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ManualDistributionScreen({ route, navigation }) {
  const {
    numTeams,
    playersPerTeam,
    timeWithOneLess,
    needExtraPlayers,
    allPlayers,
    playerAssignments,
  } = route.params;

  // Array de cores p/ cada time
  const timeColors = [
    '#EF4444', '#10B981', '#3B82F6',
    '#F59E0B', '#8B5CF6', '#EC4899',
    '#14B8A6',
  ];

  const capacityOf = (timeIndex) => {
    if (timeWithOneLess && timeIndex === numTeams - 1 && needExtraPlayers > 0) {
      return playersPerTeam - needExtraPlayers;
    }
    return playersPerTeam;
  };

  const generateTeamsArray = () => {
    const result = [];
    for (let i = 0; i < numTeams; i++) {
      const playersInTeam = allPlayers.filter(
        (p) => playerAssignments[p._internalId] === i
      );
      result.push({ timeIndex: i, jogadores: playersInTeam });
    }
    return result;
  };

  const teamsData = generateTeamsArray();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribuição dos Times</Text>
      <Text style={styles.subtitle}>Deslize para ver cada time</Text>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {teamsData.map((team, index) => {
          // Cor deste time
          const color = timeColors[index % timeColors.length];

          return (
            <View key={`page-${index}`} style={[styles.page, { width }]}>
              <Text style={[styles.teamTitle, { color }]}>
                Time {team.timeIndex + 1} ({team.jogadores.length}/{capacityOf(index)})
              </Text>

              {team.jogadores.length === 0 ? (
                <Text style={styles.noPlayers}>Nenhum jogador neste time.</Text>
              ) : (
                <FlatList
                  data={team.jogadores}
                  keyExtractor={(item, idx) => item._internalId || `fallback-${idx}`}
                  renderItem={({ item }) => (
                    <View style={styles.playerRow}>
                      {/* Ícone colorido */}
                      <Ionicons name="person-circle-outline" size={20} color={color} />
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{item.nome}</Text>
                        <View style={[
                          styles.genderBadge,
                          { backgroundColor: item.genero === 'M' ? '#4A90E2' : '#E91E63' }
                        ]}>
                          <Text style={styles.genderText}>{item.genero}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  page: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noPlayers: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    // sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  playerName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  genderText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

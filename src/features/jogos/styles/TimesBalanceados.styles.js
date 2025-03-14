// src/features/jogo/styles/TimesBalanceados.styles.js

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },

  // Título
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500', // Laranja
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 23,
  },

  // Toggle para barras de habilidades no PDF
  barrasToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  barrasToggleLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },

  // Seção de Botões PDF e Copiar Texto
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  exportButtonLeft: {
    flex: 1,
    marginRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7F00', // Laranja escuro
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 2,
  },
  exportButtonRight: {
    flex: 1,
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF', // Azul
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 2,
  },
  exportButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8, // Espaço entre o ícone e o texto
  },

  // Cartão de Time
  teamCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#FF9800',
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editNameInput: {
    borderWidth: 1,
    borderColor: '#3E8ACC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    minWidth: 100,
  },
  viewTeamLevelButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  viewTeamLevelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Lista de jogadores
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  jogadorItem: {
    width: '30%',
    margin: '1.66%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    paddingVertical: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    marginBottom: 6,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  jogadorNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  jogadorPosicao: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  jogadorEu: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  jogadorEuNome: {
    color: '#FFF',
    fontWeight: '700',
  },
  jogadorEuPosicao: {
    color: '#FFF',
  },
  emptyTeam: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginVertical: 6,
    width: '100%',
  },

  // Sugestões
  sugestoesBox: {
    backgroundColor: '#FFF',
    padding: 15,
    marginTop: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  sugestoesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noSuggestions: {
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#777',
  },

  // Modal Detalhe do Jogador
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
  },
  detailPlayerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CCC',
    marginBottom: 15,
  },
  detailPlayerName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },
  skillBarsContainer: {
    marginBottom: 15,
    width: '100%',
  },
  skillLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  skillBarWrapper: {
    width: '100%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginTop: 5,
  },
  skillBarFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 5,
  },
  detailPlayerPosition: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 5,
  },
  detailPlayerAttribute: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 5,
  },
  closeDetailButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    marginTop: 15,
  },
  closeDetailButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  // Botão Salvar e Voltar
  finishButton: {
    backgroundColor: '#FFA500',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: -2,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Botão de Ícone "Mover Jogador"
  movePlayerIconButton: {
    marginTop: 10,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  movePlayerIconText: {
    marginLeft: 5,
    color: '#007AFF',
    fontSize: 14,
  },

  // Botão "Desvincular"
  unlinkButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlinkButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },

  // Botão "Desfazer Revezamento"
  undoButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },

  // Botão Global de Desfazer Última Ação
  undoGlobalButton: {
    position: 'absolute',
    bottom: 80, // Ajuste conforme necessário
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#5856D6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  undoGlobalButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },

  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginVertical: 4,
  },
  genderText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

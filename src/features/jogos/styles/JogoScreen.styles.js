// src/features/jogo/styles/JogoScreen.styles.js

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Cartão para o TimeSelector
  timeSelectorContainer: {
    // Cor laranja de fundo
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    // Aumenta o espaçamento superior
    marginTop: 63,
    marginBottom:20,
    padding: 16,
    // Sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Lista de jogadores
  playersList: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  // Texto de lista vazia
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
    color: '#666',
  },

  // Estilos dos jogadores
  jogadorItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  jogadorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jogadorNome: {
    fontSize: 16,
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
  jogadorActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },

  // Estilos do botão de levantadores
  setterButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  setterButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },

  // Estilos do modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '60%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  levRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

// src/styles/LiveRoomScreen.styles.js

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  pix: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  idSala: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  buttonText: {
    marginLeft: 6,
    color: '#007AFF',
    fontSize: 14,
  },
  buttonFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  buttonTextFilled: {
    marginLeft: 6,
    color: '#FFF',
    fontSize: 14,
  },
  listsContainer: {
    flex: 1,
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
    color: '#333',
  },
  playerCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
});

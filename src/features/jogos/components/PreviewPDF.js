// components/PreviewPDF.js

import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const PreviewPDF = ({ htmlContent, visible, onClose, onExport }) => {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Cabeçalho do Modal */}
        <View style={styles.header}>
          <Text style={styles.title}>Pré-Visualização do PDF</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>

        {/* WebView para exibir o HTML */}
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
        />

        {/* Botão para Exportar o PDF */}
        <TouchableOpacity style={styles.exportButton} onPress={onExport}>
          <Text style={styles.exportButtonText}>Exportar PDF</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  webview: {
    flex: 1,
    margin: 10,
    height: height - 150, // Ajusta a altura conforme necessário
  },
  exportButton: {
    padding: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PreviewPDF;

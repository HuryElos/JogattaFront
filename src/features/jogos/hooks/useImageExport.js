// jogos/hooks/useImageExport.js

import { useRef } from 'react';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Alert } from 'react-native';

/**
 * Hook para gerenciar a exportação de dados como imagem.
 *
 * Retorna:
 * - viewShotRef: Referência para o componente ViewShot.
 * - exportToImage: Função para capturar e compartilhar a imagem.
 */
const useImageExport = () => {
  const viewShotRef = useRef();

  const exportToImage = async () => {
    try {
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 0.9,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar Times Balanceados',
        });
      } else {
        Alert.alert('Erro', 'Compartilhamento não disponível.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao exportar imagem.');
    }
  };

  return { viewShotRef, exportToImage };
};

export default useImageExport;

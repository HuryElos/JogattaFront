// src/features/jogo/hooks/usePDFExport.js

import {
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Asset } from 'expo-asset';
import api from '../../../services/api';
import { encode as btoa } from 'base-64';

export default function usePDFExport() {
  // 1) Solicita permissões no Android, variando conforme versão:
  async function solicitarPermissaoAndroid() {
    if (Platform.OS !== 'android') {
      return true; // iOS ou web não exigem
    }

    try {
      if (Platform.Version >= 33) {
        // Android 13+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ]);

        if (
          granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_MEDIA_VIDEO'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.READ_MEDIA_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            'Permissão negada',
            'Você precisa conceder permissão para acessar arquivos de mídia e gerar PDFs.'
          );
          return false;
        }

      } else if (Platform.Version >= 29) {
        // Android 10 (API 29) até Android 12
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        if (
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            'Permissão negada',
            'Você precisa conceder permissão para acessar o armazenamento e gerar PDFs.'
          );
          return false;
        }

      } else {
        // Android 9 (API 28) e anteriores
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        if (
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            'Permissão negada',
            'Você precisa conceder permissão para acessar o armazenamento e gerar PDFs.'
          );
          return false;
        }
      }
    } catch (err) {
      console.warn('Erro ao solicitar permissão:', err);
      return false;
    }
  }

  // 2) Calcula médias (só utilidade interna):
  const calcularMedias = (jogs = []) => {
    if (!jogs.length) return { passe: 0, ataque: 0, levantamento: 0 };
    let sp = 0, sa = 0, sl = 0;
    jogs.forEach(j => {
      sp += j.passe;
      sa += j.ataque;
      sl += j.levantamento;
    });
    const n = jogs.length;
    return {
      passe: sp / n,
      ataque: sa / n,
      levantamento: sl / n,
    };
  };

  // 3) Obtém imagem .png como base64 via expo-file-system
  async function getBase64Image() {
    try {
      // SUBSTITUIR AQUI:
      let asset;
      try {
        // Tenta usar a imagem no caminho principal
        asset = Asset.fromModule(require('../../../../assets/images/jogatta_branco.png'));
      } catch (err) {
        // Se falhar (não achou), usa a imagem local da pasta do hook
        console.warn('Falha ao carregar a imagem no caminho principal, tentando fallback...');
        asset = Asset.fromModule(require('./jogatta_branco.png'));
      }
  
      // Baixa se precisar e obtém a URI final
      await asset.downloadAsync();
      const finalUri = asset.localUri || asset.uri;
  
      // Lê a imagem em Base64
      const base64 = await FileSystem.readAsStringAsync(finalUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      console.error('Erro ao converter a imagem para Base64:', err);
      throw err;
    }
  }
  

  // 4) Funções para formatação de data:
  const formatarDataParaNomeArquivo = (date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };
  const formatarDataParaConteudo = (date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const formatarDataHoraParaConteudo = (date) => {
    const data = formatarDataParaConteudo(date);
    const hora = date.toLocaleTimeString('pt-BR', { hour12: false });
    return `${data} | ${hora}`;
  };

  // 5) Gera HTML completo para o PDF com estilos atualizados
  const gerarHTML = async (times, reservas, exibirBarras) => {
    const base64Image = await getBase64Image();
    const coresTimes = ['#FFA500', '#007AFF', '#32CD32', '#FF69B4', '#8A2BE2'];

    let html = `
    <html>
    <head>
      <meta charset="utf-8"/>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
      <style>
        @page { margin: 40px; }
        body {
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          color: #333;
          line-height: 1.6;
          background: #f8f8f8;
          margin: 0;
          padding: 0;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(90deg, #FFA500, #FF7F50);
          padding: 20px;
          border-radius: 8px 8px 0 0;
          color: #fff;
        }

        .header .title {
          flex: 1;
          text-align: left;
        }
        .header .title img {
          width: 50px;
          height: 50px;
          margin-right: 15px;
        }
        .header .title h1 {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        .header .logo {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .header .logo img {
          width: 140px; /* Ajuste o tamanho da logo conforme necessário */
          height: auto;
        }
        .header .date {
          flex: 1;
          text-align: right;
        }
        .team {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 20px;
          margin: 20px 0;
        }
        .team h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          color: #FF7F50;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        .team h2 .team-icon {
          width: 20px;
          height: 20px;
          margin-right: 10px;
        }
        .player-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .player-list li {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 16px;
        }
        .player-list li .avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #ddd;
          margin-right: 10px;
        }
        .player-list li .levantador {
          background-color: #FFA500;
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: auto;
        }
        .skill-bars {
          margin-top: 20px;
        }
        .skill-row {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .skill-label {
          width: 100px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
        }
        .skill-track {
          flex: 1;
          height: 10px;
          background: #eee;
          border-radius: 5px;
          margin: 0 10px;
          overflow: hidden;
        }
        .skill-fill {
          height: 100%;
          background: #FFA500;
        }
        .skill-value {
          width: 30px;
          text-align: right;
          font-weight: 600;
        }
        .reserva-block {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 20px;
          margin: 20px 0;
        }
        .reserva-block h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          color: #007AFF;
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">
          <h1>Times Prontos</h1>
        </div>
        <div class="logo">
          <img src="${base64Image}" alt="Jogatta Logo" />
        </div>
        <div class="date">
          ${formatarDataParaConteudo(new Date())}
        </div>
      </div>
    `;

    // Gera conteúdo dos times
    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const medias = calcularMedias(time.jogadores || []);
      const passPerc = (medias.passe / 5) * 100;
      const atkPerc = (medias.ataque / 5) * 100;
      const levPerc = (medias.levantamento / 5) * 100;
      const coresTimes = ['#FFA500', '#007AFF', '#32CD32', '#FF69B4', '#8A2BE2'];
      const corTime = coresTimes[i % coresTimes.length];

      // Jogadores
      let jogadoresHTML = '';
      (time.jogadores || []).forEach((jog) => {
        const isLev = jog.isLevantador;
        let nomeFinal = jog.nome;

        // Se revezando com outro jogador
        if (jog.revezandoCom && typeof jog.revezandoCom === 'object') {
          nomeFinal += ` - ${jog.revezandoCom.nome} (Revezando)`;
        } else if (jog.revezandoCom && typeof jog.revezandoCom === 'string') {
          nomeFinal += ` - ${jog.revezandoCom} (Revezando)`;
        }

        jogadoresHTML += `
          <li>
            <div class="avatar"></div>
            ${nomeFinal}
            ${isLev ? '<span class="levantador">Levantador</span>' : ''}
          </li>
        `;
      });

      html += `
        <div class="team">
          <h2>
            <img src="data:image/svg+xml;base64,${btoa(
              `<svg xmlns="http://www.w3.org/2000/svg" fill="${corTime}" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
            )}" class="team-icon" alt="Ícone do Time" />
            ${time.nomeTime || `Time ${i + 1}`}
          </h2>
          <ul class="player-list">
            ${jogadoresHTML}
          </ul>
      `;

      // Barras de skill se exibirBarras = true
      if (exibirBarras) {
        html += `
          <div class="skill-bars">
            <div class="skill-row">
              <div class="skill-label">Passe</div>
              <div class="skill-track">
                <div class="skill-fill" style="width: ${passPerc}%; background: ${corTime};"></div>
              </div>
              <div class="skill-value">${medias.passe.toFixed(1)}</div>
            </div>
            <div class="skill-row">
              <div class="skill-label">Ataque</div>
              <div class="skill-track">
                <div class="skill-fill" style="width: ${atkPerc}%; background: ${corTime};"></div>
              </div>
              <div class="skill-value">${medias.ataque.toFixed(1)}</div>
            </div>
            <div class="skill-row">
              <div class="skill-label">Levant.</div>
              <div class="skill-track">
                <div class="skill-fill" style="width: ${levPerc}%; background: ${corTime};"></div>
              </div>
              <div class="skill-value">${medias.levantamento.toFixed(1)}</div>
            </div>
          </div>
        `;
      }

      html += `</div>`;
    }

    // Reservas
    if (reservas?.length > 0) {
      let reservasHTML = '';
      reservas.forEach((r) => {
        reservasHTML += `
          <li>
            <div class="avatar"></div>
            ${r.nome || 'Reserva'}
          </li>
        `;
      });
      html += `
        <div class="reserva-block">
          <h2>Reservas</h2>
          <ul class="player-list">
            ${reservasHTML}
          </ul>
        </div>
      `;
    }

    // Rodapé
    html += `
      <div class="footer">
        <p>Relatório gerado por <strong>Jogatta</strong> — Organize seu jogo de vôlei com facilidade!</p>
        <p>Data: ${formatarDataParaConteudo(new Date())} | Hora: ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>© ${new Date().getFullYear()} Jogatta</p>
      </div>
    </body>
    </html>
    `;
    return html;
  };

  // 6) Exporta o HTML para PDF usando expo-print
  const exportToPDF = async (htmlContent) => {
    try {
      // Gera um PDF temporário
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      console.log('PDF temporário gerado em:', uri);

      // Renomeia com data
      const dataAtual = new Date();
      const dataFormatada = formatarDataParaNomeArquivo(dataAtual);
      const novoCaminho = `${FileSystem.documentDirectory}Times_Jogatta_${dataFormatada}.pdf`;

      await FileSystem.moveAsync({
        from: uri,
        to: novoCaminho,
      });
      console.log('PDF final renomeado para:', novoCaminho);

      // Tenta compartilhar
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(novoCaminho);
      } else {
        Alert.alert('PDF Gerado', `PDF salvo em: ${novoCaminho}`);
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
      throw error;
    }
  };

  // 7) Função principal para gerar e compartilhar PDF
  const gerarPDF = async (times, reservas, exibirBarras) => {
    await api
      .post('/api/pdf/logStatus', {
        status: 'iniciando',
        info: 'Gerando PDF (expo-print)...',
      })
      .catch((err) => {
        console.log('Erro ao logar status PDF (iniciando):', err?.message);
      });

    try {
      const permOk = await solicitarPermissaoAndroid();
      if (!permOk) {
        await api.post('/api/pdf/logStatus', {
          status: 'erro',
          info: 'Permissão de armazenamento negada pelo usuário.',
        });
        throw new Error('Permissão negada para salvar PDF no Android.');
      }

      const htmlContent = await gerarHTML(times, reservas, exibirBarras);
      await exportToPDF(htmlContent);

      await api.post('/api/pdf/logStatus', {
        status: 'sucesso',
        info: 'PDF gerado com sucesso via expo-print!',
      });
    } catch (error) {
      await api.post('/api/pdf/logStatus', {
        status: 'erro',
        info: error?.message || 'Falha ao gerar PDF (expo-print).',
      });
      throw error;
    }
  };

  return { gerarPDF };
}

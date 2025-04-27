// src/features/jogos/components/CheckoutCofreModal.js

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PagamentoStripe from './PagamentoStripe';

export default function CheckoutCofreModal({
  visible,
  onClose,
  reservaId,
  ownerId,
  amount,
  id_usuario,
  quantidadeJogadores,
  onPaymentSuccess,
  forcarAtualizacaoStatusJogador
}) {
  // amount já está em centavos
  const valorTotal = (amount / 100).toFixed(2); // Converter centavos para reais
  const valorPorJogador = (amount / quantidadeJogadores / 100).toFixed(2); // em reais

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Overlay escuro */}
      <View style={styles.overlay}>
        {/* Evita que o teclado esconda os campos */}
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            {/* Botão de fechar no canto superior */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#FF6B00" />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Contribua com o Cofre</Text>
              
              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Total da Quadra</Text>
                    <Text style={styles.infoValue}>R$ {valorTotal}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Jogadores</Text>
                    <Text style={styles.infoValue}>{quantidadeJogadores}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.valorPorJogadorContainer}>
                  <Text style={styles.valorPorJogadorLabel}>Valor por Jogador</Text>
                  <Text style={styles.valorPorJogadorValue}>
                    R$ {valorPorJogador}
                  </Text>
                </View>
              </View>
            </View>

            {/* Componente de Pagamento */}
            <PagamentoStripe
              reservaId={reservaId}
              ownerId={ownerId}
              amount={Math.round(amount / quantidadeJogadores)} // valor unitário em centavos
              id_usuario={id_usuario}
              onClose={onClose}
              quantidadeJogadores={quantidadeJogadores}
              onPaymentSuccess={onPaymentSuccess}
              forcarAtualizacaoStatusJogador={forcarAtualizacaoStatusJogador}
            />

            {/* Botão de "Fechar" extra (opcional) */}
            <TouchableOpacity onPress={onClose} style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    // Sombras/elevations para ficar mais "card"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  valorPorJogadorContainer: {
    alignItems: 'center',
  },
  valorPorJogadorLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  valorPorJogadorValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B00',
  },
  footerButton: {
    alignSelf: 'center',
    marginTop: 12,
  },
  footerButtonText: {
    color: '#FF6B00',
    fontWeight: '600',
    fontSize: 16
  }
});

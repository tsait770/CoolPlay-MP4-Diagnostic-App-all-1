import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { X, Key, Copy } from 'lucide-react-native';
import { useBitcoinWallet, WalletType } from '@/providers/BitcoinWalletProvider';
import { useTranslation } from '@/hooks/useTranslation';
import Colors from '@/constants/colors';

interface CreateWalletModalProps {
  visible: boolean;
  onClose: () => void;
}

const generateMnemonic = (wordCount: 12 | 24 = 12): string => {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  ];
  
  const mnemonic: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    mnemonic.push(words[Math.floor(Math.random() * words.length)]);
  }
  return mnemonic.join(' ');
};

export default function CreateWalletModal({ visible, onClose }: CreateWalletModalProps) {
  const { t } = useTranslation();
  const { createWallet } = useBitcoinWallet();
  const [step, setStep] = useState<'setup' | 'display' | 'confirm'>('setup');
  const [walletLabel, setWalletLabel] = useState('');
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [mnemonic, setMnemonic] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const handleGenerate = () => {
    const newMnemonic = generateMnemonic(wordCount);
    setMnemonic(newMnemonic);
    setStep('display');
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirm = async () => {
    if (!confirmed) {
      Alert.alert(t('warning'), t('must_confirm_backup'));
      return;
    }

    if (!walletLabel.trim()) {
      Alert.alert(t('error'), t('wallet_label_required'));
      return;
    }

    setLoading(true);
    try {
      const success = await createWallet(
        walletLabel,
        mnemonic,
        'mnemonic' as WalletType,
        undefined
      );

      if (success) {
        Alert.alert(t('success'), t('wallet_created_success'));
        handleClose();
      }
    } catch (error) {
      console.error('[CreateWallet] Error:', error);
      Alert.alert(t('error'), t('wallet_creation_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setWalletLabel('');
    setMnemonic('');
    setConfirmed(false);
    fadeAnim.setValue(0);
    onClose();
  };

  const renderSetupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('create_new_wallet')}</Text>
      <Text style={styles.stepDescription}>{t('create_wallet_description')}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('wallet_label')}</Text>
        <TextInput
          style={styles.input}
          value={walletLabel}
          onChangeText={setWalletLabel}
          placeholder={t('enter_wallet_name')}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('seed_phrase_length')}</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radioButton, wordCount === 12 && styles.radioButtonActive]}
            onPress={() => setWordCount(12)}
            activeOpacity={0.7}
          >
            <Text style={[styles.radioText, wordCount === 12 && styles.radioTextActive]}>
              12 {t('words')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, wordCount === 24 && styles.radioButtonActive]}
            onPress={() => setWordCount(24)}
            activeOpacity={0.7}
          >
            <Text style={[styles.radioText, wordCount === 24 && styles.radioTextActive]}>
              24 {t('words')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleGenerate}
        disabled={!walletLabel.trim()}
        activeOpacity={0.7}
      >
        <Key size={20} color="#212121" />
        <Text style={styles.primaryButtonText}>{t('generate_seed_phrase')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDisplayStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('your_seed_phrase')}</Text>
      <Text style={styles.warningText}>{t('seed_phrase_warning')}</Text>

      <Animated.View style={[styles.mnemonicContainer, { opacity: fadeAnim }]}>
        <ScrollView style={styles.mnemonicScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.mnemonicGrid}>
            {mnemonic.split(' ').map((word, index) => (
              <View key={index} style={styles.mnemonicWord}>
                <Text style={styles.mnemonicIndex}>{index + 1}</Text>
                <Text style={styles.mnemonicText}>{word}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setConfirmed(!confirmed)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
          {confirmed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{t('i_have_written_down')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, !confirmed && styles.primaryButtonDisabled]}
        onPress={handleConfirm}
        disabled={!confirmed || loading}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? t('creating') : t('create_wallet')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('setup')}
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryButtonText}>{t('back')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <X size={24} color="#fff" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {step === 'setup' && renderSetupStep()}
            {step === 'display' && renderDisplayStep()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#212121',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#e81cff',
    borderLeftColor: '#40c9ff',
    borderRightColor: '#40c9ff',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#323232',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  stepContainer: {
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 13,
    color: '#ff6b6b',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#414141',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#414141',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: '#e81cff',
    backgroundColor: 'rgba(232, 28, 255, 0.1)',
  },
  radioText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600' as const,
  },
  radioTextActive: {
    color: '#e81cff',
  },
  mnemonicContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#414141',
    maxHeight: 300,
  },
  mnemonicScroll: {
    maxHeight: 280,
  },
  mnemonicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mnemonicWord: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#323232',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  mnemonicIndex: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600' as const,
    minWidth: 16,
  },
  mnemonicText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500' as const,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#414141',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#40c9ff',
    borderColor: '#40c9ff',
  },
  checkmark: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#212121',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#323232',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#414141',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});

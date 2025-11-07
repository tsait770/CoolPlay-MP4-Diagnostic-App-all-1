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
} from 'react-native';
import { X, Upload, Key, Scan } from 'lucide-react-native';
import { useBitcoinWallet, WalletType } from '@/providers/BitcoinWalletProvider';
import { useTranslation } from '@/hooks/useTranslation';

interface ImportWalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ImportWalletModal({ visible, onClose }: ImportWalletModalProps) {
  const { t } = useTranslation();
  const { importWallet } = useBitcoinWallet();
  const [walletLabel, setWalletLabel] = useState('');
  const [privateData, setPrivateData] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('mnemonic');
  const [loading, setLoading] = useState(false);

  const validateInput = (): boolean => {
    if (!walletLabel.trim()) {
      Alert.alert(t('error'), t('wallet_label_required'));
      return false;
    }

    if (!privateData.trim()) {
      Alert.alert(t('error'), t('private_data_required'));
      return false;
    }

    const trimmedData = privateData.trim();
    
    if (walletType === 'mnemonic') {
      const words = trimmedData.split(/\s+/);
      if (![12, 15, 18, 21, 24].includes(words.length)) {
        Alert.alert(t('error'), t('invalid_mnemonic_length'));
        return false;
      }
    }

    if (walletType === 'private_key' && trimmedData.length !== 64) {
      Alert.alert(t('warning'), t('private_key_length_warning'));
    }

    return true;
  };

  const handleImport = async () => {
    if (!validateInput()) return;

    setLoading(true);
    try {
      const success = await importWallet(
        walletLabel,
        privateData.trim(),
        walletType,
        undefined
      );

      if (success) {
        Alert.alert(t('success'), t('wallet_imported_success'));
        handleClose();
      }
    } catch (error) {
      console.error('[ImportWallet] Error:', error);
      Alert.alert(t('error'), t('wallet_import_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setWalletLabel('');
    setPrivateData('');
    setWalletType('mnemonic');
    onClose();
  };

  const handleScanQR = () => {
    Alert.alert(t('info'), t('qr_scan_coming_soon'));
  };

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
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{t('import_wallet')}</Text>
              <Text style={styles.stepDescription}>{t('import_wallet_description')}</Text>

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
                <Text style={styles.label}>{t('wallet_type')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.typeGroup}>
                    <TouchableOpacity
                      style={[styles.typeButton, walletType === 'mnemonic' && styles.typeButtonActive]}
                      onPress={() => setWalletType('mnemonic')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typeText, walletType === 'mnemonic' && styles.typeTextActive]}>
                        {t('seed_phrase')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, walletType === 'private_key' && styles.typeButtonActive]}
                      onPress={() => setWalletType('private_key')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typeText, walletType === 'private_key' && styles.typeTextActive]}>
                        {t('private_key')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, walletType === 'wif' && styles.typeButtonActive]}
                      onPress={() => setWalletType('wif')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typeText, walletType === 'wif' && styles.typeTextActive]}>
                        WIF
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, walletType === 'xprv' && styles.typeButtonActive]}
                      onPress={() => setWalletType('xprv')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typeText, walletType === 'xprv' && styles.typeTextActive]}>
                        XPRV
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    {walletType === 'mnemonic' ? t('seed_phrase') : t('private_key_data')}
                  </Text>
                  <TouchableOpacity onPress={handleScanQR} activeOpacity={0.7}>
                    <Scan size={18} color="#40c9ff" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={privateData}
                  onChangeText={setPrivateData}
                  placeholder={
                    walletType === 'mnemonic'
                      ? t('enter_seed_phrase_placeholder')
                      : t('enter_private_key_placeholder')
                  }
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.warningBox}>
                <Key size={16} color="#ff6b6b" />
                <Text style={styles.warningText}>{t('import_warning')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleImport}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Upload size={20} color="#212121" />
                <Text style={styles.primaryButtonText}>
                  {loading ? t('importing') : t('import_wallet')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
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
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
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
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  typeGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#414141',
    backgroundColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: '#40c9ff',
    backgroundColor: 'rgba(64, 201, 255, 0.1)',
  },
  typeText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600' as const,
  },
  typeTextActive: {
    color: '#40c9ff',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#ff6b6b',
    lineHeight: 18,
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

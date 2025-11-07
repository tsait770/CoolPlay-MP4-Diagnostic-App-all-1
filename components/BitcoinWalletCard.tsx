import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { Eye, EyeOff, Cloud, Edit, Trash2, Copy, CheckCircle } from 'lucide-react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { useBitcoinWallet, BitcoinWallet } from '@/providers/BitcoinWalletProvider';
import { useTranslation } from '@/hooks/useTranslation';
import Colors from '@/constants/colors';

interface BitcoinWalletCardProps {
  wallet: BitcoinWallet;
  onEdit?: (wallet: BitcoinWallet) => void;
}

export default function BitcoinWalletCard({ wallet, onEdit }: BitcoinWalletCardProps) {
  const { t } = useTranslation();
  const { viewWalletKey, deleteWallet, backupWallet, setActiveWallet, clipboardClearTime } = useBitcoinWallet();
  const [showKey, setShowKey] = useState(false);
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleViewKey = async () => {
    if (showKey) {
      setShowKey(false);
      setDecryptedKey(null);
      if (Platform.OS !== 'web') {
        await ScreenCapture.allowScreenCaptureAsync();
      }
      return;
    }

    setLoading(true);
    animatePress();

    try {
      if (Platform.OS !== 'web') {
        await ScreenCapture.preventScreenCaptureAsync();
      }

      const key = await viewWalletKey(wallet.id);
      if (key) {
        setDecryptedKey(key);
        setShowKey(true);
      }
    } catch (error) {
      console.error('[BitcoinWalletCard] View key error:', error);
      Alert.alert(t('error'), t('failed_to_decrypt'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!decryptedKey) return;

    Clipboard.setString(decryptedKey);
    setCopied(true);

    setTimeout(() => {
      Clipboard.setString('');
      setCopied(false);
    }, clipboardClearTime * 1000);

    Alert.alert(
      t('copied'),
      `${t('key_copied_clipboard')} ${clipboardClearTime}${t('seconds')}`
    );
  };

  const handleBackup = async () => {
    Alert.alert(
      t('backup_wallet'),
      t('backup_wallet_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('backup'),
          onPress: async () => {
            const success = await backupWallet(wallet.id);
            if (success) {
              Alert.alert(t('success'), t('wallet_backed_up'));
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      t('delete_wallet'),
      t('delete_wallet_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteWallet(wallet.id);
            if (success) {
              Alert.alert(t('success'), t('wallet_deleted'));
            }
          },
        },
      ]
    );
  };

  const handleSetActive = async () => {
    await setActiveWallet(wallet.id);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '***...***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={handleSetActive} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <View style={[styles.icon, wallet.is_active && styles.iconActive]}>
              <Text style={styles.iconText}>₿</Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{wallet.label}</Text>
              {wallet.is_active && (
                <View style={styles.activeBadge}>
                  <CheckCircle size={12} color={Colors.success} />
                  <Text style={styles.activeBadgeText}>{t('active')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.keyPreview}>
              {showKey && decryptedKey ? decryptedKey : maskKey(wallet.address || '***')}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{wallet.type.toUpperCase()}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{wallet.network.replace('bitcoin-', '')}</Text>
              {wallet.is_backed_up && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Cloud size={12} color={Colors.success} />
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewKey}
          disabled={loading}
          activeOpacity={0.7}
        >
          {showKey ? (
            <EyeOff size={18} color={Colors.primary.accent} />
          ) : (
            <Eye size={18} color={Colors.primary.accent} />
          )}
        </TouchableOpacity>

        {showKey && decryptedKey && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Copy size={18} color={copied ? Colors.success : Colors.primary.accent} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleBackup}
          activeOpacity={0.7}
        >
          <Cloud size={18} color={wallet.is_backed_up ? Colors.success : Colors.primary.accent} />
        </TouchableOpacity>

        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(wallet)}
            activeOpacity={0.7}
          >
            <Edit size={18} color={Colors.primary.accent} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#212121',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'solid',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F57C4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: '#40c9ff',
    shadowColor: '#40c9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginRight: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 201, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
    textTransform: 'uppercase' as const,
  },
  keyPreview: {
    fontSize: 13,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
  },
  metaDot: {
    fontSize: 11,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#323232',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#323232',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

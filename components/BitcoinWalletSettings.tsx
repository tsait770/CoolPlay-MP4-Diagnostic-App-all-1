import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Shield, Clock, Clipboard } from 'lucide-react-native';
import { useBitcoinWallet } from '@/providers/BitcoinWalletProvider';
import { useTranslation } from '@/hooks/useTranslation';
import Colors from '@/constants/colors';

export default function BitcoinWalletSettings() {
  const { t } = useTranslation();
  const {
    biometricEnabled,
    autoLockTimeout,
    clipboardClearTime,
    setBiometricEnabled,
    setAutoLockTimeout,
    setClipboardClearTime,
  } = useBitcoinWallet();

  const lockTimeouts = [
    { label: '30 ' + t('seconds'), value: 30 },
    { label: '60 ' + t('seconds'), value: 60 },
    { label: '5 ' + t('minutes'), value: 300 },
    { label: t('never'), value: 0 },
  ];

  const clipboardTimes = [
    { label: '15 ' + t('seconds'), value: 15 },
    { label: '30 ' + t('seconds'), value: 30 },
    { label: '60 ' + t('seconds'), value: 60 },
  ];

  const handleLockTimeoutChange = (value: number) => {
    Alert.alert(
      t('confirm'),
      `${t('change_auto_lock_to')} ${value === 0 ? t('never') : value + ' ' + t('seconds')}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('confirm'), onPress: () => setAutoLockTimeout(value) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>{t('security_settings')}</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconContainer}>
              <Shield size={20} color={Colors.primary.accent} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>{t('biometric_authentication')}</Text>
              <Text style={styles.settingDescription}>
                {t('use_face_id_fingerprint')}
              </Text>
            </View>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: '#3e3e3e', true: Colors.primary.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <View style={styles.iconContainer}>
            <Clock size={20} color={Colors.primary.accent} />
          </View>
          <Text style={styles.settingLabel}>{t('auto_lock_timeout')}</Text>
        </View>
        <Text style={styles.settingDescription}>
          {t('auto_lock_description')}
        </Text>
        <View style={styles.optionsContainer}>
          {lockTimeouts.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                autoLockTimeout === option.value && styles.optionButtonActive,
              ]}
              onPress={() => handleLockTimeoutChange(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  autoLockTimeout === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <View style={styles.iconContainer}>
            <Clipboard size={20} color={Colors.primary.accent} />
          </View>
          <Text style={styles.settingLabel}>{t('clipboard_clear_time')}</Text>
        </View>
        <Text style={styles.settingDescription}>
          {t('clipboard_clear_description')}
        </Text>
        <View style={styles.optionsContainer}>
          {clipboardTimes.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                clipboardClearTime === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setClipboardClearTime(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  clipboardClearTime === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Shield size={16} color="#40c9ff" />
        <Text style={styles.infoText}>{t('bitcoin_wallet_security_info')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: '#212121',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#323232',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#414141',
    backgroundColor: 'transparent',
  },
  optionButtonActive: {
    borderColor: '#40c9ff',
    backgroundColor: 'rgba(64, 201, 255, 0.1)',
  },
  optionText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600' as const,
  },
  optionTextActive: {
    color: '#40c9ff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(64, 201, 255, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#40c9ff',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#40c9ff',
    lineHeight: 18,
  },
});

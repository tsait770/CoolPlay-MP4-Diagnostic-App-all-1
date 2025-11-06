import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Circle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';
import Slider from '@react-native-community/slider';

const STORAGE_KEY = '@floating_ball_settings';

interface FloatingBallSettings {
  isEnabled: boolean;
  opacity: number;
  tripleTapToggle: boolean;
}

export default function FloatingBallSettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<FloatingBallSettings>({
    isEnabled: true,
    opacity: 0.9,
    tripleTapToggle: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load floating ball settings:', error);
    }
  };

  const saveSettings = async (newSettings: FloatingBallSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save floating ball settings:', error);
      Alert.alert(t('error'), 'Failed to save settings');
    }
  };

  const updateSetting = (key: keyof FloatingBallSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: t('floating_ball_settings'),
          headerStyle: { backgroundColor: Colors.secondary.bg },
          headerTintColor: Colors.primary.text,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('basic_settings')}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Circle size={20} color={Colors.accent.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{t('enable_floating_ball')}</Text>
                <Text style={styles.settingDescription}>
                  {t('show_floating_ball_on_player')}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.isEnabled}
              onValueChange={(value) => updateSetting('isEnabled', value)}
              trackColor={{ false: Colors.card.border, true: Colors.accent.primary }}
              thumbColor="white"
              ios_backgroundColor={Colors.card.border}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Circle size={20} color={Colors.accent.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>
                  {t('triple_tap_toggle')} {Platform.OS !== 'web' && '(Beta)'}
                </Text>
                <Text style={styles.settingDescription}>
                  {Platform.OS !== 'web'
                    ? t('triple_tap_phone_back_description')
                    : t('feature_not_available_on_web')}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.tripleTapToggle}
              onValueChange={(value) => updateSetting('tripleTapToggle', value)}
              trackColor={{ false: Colors.card.border, true: Colors.accent.primary }}
              thumbColor="white"
              ios_backgroundColor={Colors.card.border}
              disabled={Platform.OS === 'web'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('appearance')}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingFull}>
              <View style={styles.settingLeft}>
                <Circle size={20} color={Colors.accent.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>{t('opacity')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('adjust_floating_ball_opacity')}: {Math.round(settings.opacity * 100)}%
                  </Text>
                </View>
              </View>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0.3}
                  maximumValue={1.0}
                  step={0.1}
                  value={settings.opacity}
                  onValueChange={(value: number) => updateSetting('opacity', value)}
                  minimumTrackTintColor={Colors.accent.primary}
                  maximumTrackTintColor={Colors.card.border}
                  thumbTintColor={Colors.accent.primary}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>30%</Text>
                  <Text style={styles.sliderLabel}>100%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('control_functions')}</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('available_controls')}</Text>
            <View style={styles.controlItem}>
              <Text style={styles.controlIcon}>⬆️</Text>
              <Text style={styles.controlText}>{t('play_pause_control')}</Text>
            </View>
            <View style={styles.controlItem}>
              <Text style={styles.controlIcon}>⬇️</Text>
              <Text style={styles.controlText}>{t('voice_control_toggle')}</Text>
            </View>
            <View style={styles.controlItem}>
              <Text style={styles.controlIcon}>⬅️</Text>
              <Text style={styles.controlText}>{t('volume_control_tap_reduce_long_press_mute')}</Text>
            </View>
            <View style={styles.controlItem}>
              <Text style={styles.controlIcon}>➡️</Text>
              <Text style={styles.controlText}>
                {t('speed_control_cycle_long_press_2x')}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('usage_tips')}</Text>
            <Text style={styles.tipText}>• {t('drag_to_move_floating_ball')}</Text>
            <Text style={styles.tipText}>• {t('tap_center_to_expand')}</Text>
            <Text style={styles.tipText}>• {t('long_press_for_special_functions')}</Text>
            {Platform.OS !== 'web' && settings.tripleTapToggle && (
              <Text style={styles.tipText}>• {t('triple_tap_phone_back_to_toggle')}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  settingFull: {
    flex: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 18,
  },
  sliderContainer: {
    marginTop: 12,
    paddingLeft: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  controlText: {
    fontSize: 14,
    color: Colors.primary.text,
    flex: 1,
  },
  tipText: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});

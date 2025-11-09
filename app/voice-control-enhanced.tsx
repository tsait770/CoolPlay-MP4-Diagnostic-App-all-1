import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import MinimalGlowControls from '@/components/MinimalGlowControls';
import { useTranslation } from '@/hooks/useTranslation';
import Colors from '@/constants/colors';

export default function VoiceControlEnhancedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [duration] = useState(180);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(prev => Math.max(0, Math.min(duration, prev + seconds)));
  };

  const handleVolumeChange = (volume: number) => {
    console.log('Volume changed to:', volume);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('enhanced_voice_control')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.introTitle}>
              {t('minimal_glow_controller')}
            </Text>
            <Text style={styles.introText}>
              {t('minimal_glow_description')}
            </Text>
          </View>

          <MinimalGlowControls
            videoTitle={t('sample_video_title')}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
          />

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>{t('key_features')}</Text>
            <View style={styles.featureList}>
              <FeatureItem
                icon="🎨"
                title={t('gradient_border_glow')}
                description={t('gradient_border_description')}
              />
              <FeatureItem
                icon="🎤"
                title={t('cyan_microphone')}
                description={t('cyan_microphone_description')}
              />
              <FeatureItem
                icon="📊"
                title={t('usage_stats')}
                description={t('usage_stats_description')}
              />
              <FeatureItem
                icon="🔄"
                title={t('always_listen')}
                description={t('always_listen_description')}
              />
            </View>
          </View>
        </ScrollView>
    </View>
  );
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  intro: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
  },
  features: {
    marginTop: 32,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 16,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
});

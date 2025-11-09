import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Link, AlertCircle, Crown, Star, Sparkles } from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useTranslation } from '@/hooks/useTranslation';
import { useMembership } from '@/providers/MembershipProvider';

interface VideoURLModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

export default function VideoURLModal({ visible, onClose, onSubmit }: VideoURLModalProps) {
  const { t } = useTranslation();
  const { tier } = useMembership();
  const [url, setUrl] = useState('https://youtu.be/WBzofAAt32U?si=tyFEZH7lipE7j51L');

  const handleSubmit = () => {
    if (url.trim()) {
      onSubmit(url.trim());
      setUrl('');
    }
  };

  const handleClose = () => {
    setUrl('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Link size={24} color={Colors.primary.accent} />
                <Text style={styles.title}>{t('enter_video_url')}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={Colors.primary.text} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>{t('video_url_input_hint')}</Text>

            {/* URL Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('video_url')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('video_url_placeholder')}
                placeholderTextColor={Colors.primary.textSecondary}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Supported Video Sources */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="video" size={18} color={Colors.primary.accent} />
                <Text style={styles.sectionTitle}>{t('supported_video_sources')}</Text>
              </View>
              
              <View style={styles.sourceList}>
                <SourceItem icon="file-video" text={t('direct_video_files')} />
                <SourceItem icon="youtube" text={t('video_platforms')} />
                <SourceItem icon="share-alt" text={t('social_media_videos')} />
                <SourceItem icon="exclamation-triangle" text={t('adult_sites_18plus')} isAdult />
                <SourceItem icon="cloud" text={t('cloud_videos')} />
                <SourceItem icon="folder" text={t('local_videos')} />
                <SourceItem icon="link" text={t('direct_url_streams')} />
              </View>

              <View style={styles.warningBox}>
                <AlertCircle size={16} color="#FFA500" />
                <Text style={styles.warningText}>{t('adult_content_age_verification')}</Text>
              </View>
            </View>

            {/* Supported Video Formats */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="file-code" size={18} color={Colors.primary.accent} />
                <Text style={styles.sectionTitle}>{t('supported_video_formats')}</Text>
              </View>
              
              <View style={styles.formatList}>
                <FormatItem label={t('container_formats')} value="MP4, MKV, AVI, MOV, FLV, WMV, WebM, 3GP, TS" />
                <FormatItem label={t('streaming_protocols')} value="HLS (.m3u8), MPEG-DASH (.mpd), RTMP/RTSP, Progressive MP4" />
                <FormatItem label={t('video_codecs')} value="H.264, H.265 (HEVC), VP8, VP9, AV1" />
                <FormatItem label={t('audio_codecs')} value="AAC, MP3, Opus, Vorbis, AC3, E-AC3" />
              </View>
            </View>

            {/* Usage Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="info-circle" size={18} color={Colors.primary.accent} />
                <Text style={styles.sectionTitle}>{t('usage_notes')}</Text>
              </View>
              
              <View style={styles.notesList}>
                <NoteItem text={t('adult_content_age_restriction')} />
                <NoteItem text={t('no_illegal_content')} />
                <NoteItem text={t('follow_local_laws')} />
                <NoteItem text={t('no_browsing_history_saved')} />
              </View>
            </View>

            {/* Membership Tiers */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="crown" size={18} color={Colors.primary.accent} />
                <Text style={styles.sectionTitle}>{t('membership_tiers')}</Text>
              </View>

              <MembershipTier
                icon={<Sparkles size={20} color="#FFD166" />}
                title={t('free_trial')}
                usage={t('trial_uses_2000')}
                sources={t('all_formats_trial')}
                description={t('trial_description')}
                isActive={tier === 'free_trial'}
              />

              <MembershipTier
                icon={<FontAwesome5 name="user" size={18} color="#B0BEC5" />}
                title={t('free_member')}
                usage={t('daily_30_uses')}
                sources={t('basic_formats_only')}
                description={t('free_member_description')}
                isActive={tier === 'free'}
              />

              <MembershipTier
                icon={<Star size={20} color="#6CD4FF" />}
                title={t('basic_member')}
                usage={t('monthly_1500_plus_daily_40')}
                sources={t('all_formats_including_adult')}
                description={t('basic_member_description')}
                isActive={tier === 'basic'}
              />

              <MembershipTier
                icon={<Crown size={20} color="#FFD166" />}
                title={t('premium_member')}
                usage={t('unlimited_uses')}
                sources={t('all_formats_including_adult')}
                description={t('premium_member_description')}
                isActive={tier === 'premium'}
              />

              <View style={styles.upgradeHint}>
                <FontAwesome5 name="arrow-up" size={14} color={Colors.primary.accent} />
                <Text style={styles.upgradeHintText}>{t('upgrade_unlock_features')}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleSubmit}
              >
                <FontAwesome5 name="download" size={16} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>{t('load_video')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface SourceItemProps {
  icon: string;
  text: string;
  isAdult?: boolean;
}

function SourceItem({ icon, text, isAdult }: SourceItemProps) {
  return (
    <View style={styles.sourceItem}>
      <FontAwesome5 name={icon} size={14} color={Colors.primary.accent} />
      <Text style={styles.sourceText}>{text}</Text>
      {isAdult && (
        <View style={styles.adultBadge}>
          <Text style={styles.adultBadgeText}>18+</Text>
        </View>
      )}
    </View>
  );
}

interface FormatItemProps {
  label: string;
  value: string;
}

function FormatItem({ label, value }: FormatItemProps) {
  return (
    <View style={styles.formatItem}>
      <Text style={styles.formatLabel}>{label}</Text>
      <Text style={styles.formatValue}>{value}</Text>
    </View>
  );
}

interface NoteItemProps {
  text: string;
}

function NoteItem({ text }: NoteItemProps) {
  return (
    <View style={styles.noteItem}>
      <View style={styles.noteBullet} />
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

interface MembershipTierProps {
  icon: React.ReactNode;
  title: string;
  usage: string;
  sources: string;
  description: string;
  isActive: boolean;
}

function MembershipTier({ icon, title, usage, sources, description, isActive }: MembershipTierProps) {
  return (
    <View style={[styles.tierCard, isActive && styles.tierCardActive]}>
      <View style={styles.tierHeader}>
        <View style={styles.tierIcon}>
          {icon}
        </View>
        <Text style={styles.tierTitle}>{title}</Text>
        {isActive && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </View>
      <View style={styles.tierDetails}>
        <TierDetail icon="clock" text={usage} />
        <TierDetail icon="video" text={sources} />
      </View>
      <Text style={styles.tierDescription}>{description}</Text>
    </View>
  );
}

interface TierDetailProps {
  icon: string;
  text: string;
}

function TierDetail({ icon, text }: TierDetailProps) {
  return (
    <View style={styles.tierDetail}>
      <FontAwesome5 name={icon} size={12} color={Colors.primary.textSecondary} />
      <Text style={styles.tierDetailText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.secondary.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary.text,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card.bg,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.primary.text,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  sourceList: {
    gap: 10,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  sourceText: {
    fontSize: 14,
    color: Colors.primary.text,
    flex: 1,
  },
  adultBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adultBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  warningText: {
    fontSize: 13,
    color: '#FFA500',
    flex: 1,
  },
  formatList: {
    gap: 12,
  },
  formatItem: {
    backgroundColor: Colors.card.bg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  formatLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary.accent,
    marginBottom: 4,
  },
  formatValue: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    lineHeight: 18,
  },
  notesList: {
    gap: 8,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.accent,
    marginTop: 6,
  },
  noteText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tierCard: {
    backgroundColor: Colors.card.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  tierCardActive: {
    borderColor: Colors.primary.accent,
    borderWidth: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tierIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary.text,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  tierDetails: {
    gap: 6,
    marginBottom: 8,
  },
  tierDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierDetailText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
  },
  tierDescription: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(108, 212, 255, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeHintText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: Colors.card.bg,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  confirmButton: {
    backgroundColor: '#69E7D8',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});

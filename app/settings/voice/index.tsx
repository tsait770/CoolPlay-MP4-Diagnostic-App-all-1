import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Mic, ChevronRight, TestTube2, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import MP4DiagnosticTool from "@/components/MP4DiagnosticTool";
import MP4Player from "@/components/MP4Player";

export default function VoiceIndexScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const voiceItems = [
    {
      icon: Mic,
      label: t("custom_commands"),
      route: "/settings/voice/commands",
    },
    {
      icon: Mic,
      label: t("siri_voice_assistant"),
      route: "/settings/voice/assistant",
    },
  ];

  const diagnosticItem = {
    icon: TestTube2,
    label: "MP4 錯誤診斷器",
    subtitle: "診斷和修復 MP4 播放問題",
    action: () => setShowDiagnostic(true),
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Mic size={48} color={Colors.primary.accent} strokeWidth={2} />
          </View>
          <Text style={styles.headerTitle}>{t("voice_control")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("voice_control_instruction")}
          </Text>
        </View>

        {voiceItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={index}
              style={styles.item}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.itemContent}>
                <Icon size={20} color={Colors.primary.accent} />
                <Text style={styles.itemText}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color={Colors.primary.textSecondary} />
            </Pressable>
          );
        })}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>開發者工具</Text>
        </View>

        <Pressable
          style={[styles.item, styles.diagnosticItem]}
          onPress={diagnosticItem.action}
        >
          <View style={styles.itemContent}>
            <View style={styles.diagnosticIconContainer}>
              <TestTube2 size={20} color="#fff" />
            </View>
            <View style={styles.diagnosticTextContainer}>
              <Text style={styles.itemText}>{diagnosticItem.label}</Text>
              <Text style={styles.itemSubtitle}>{diagnosticItem.subtitle}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.primary.textSecondary} />
        </Pressable>
      </ScrollView>

      <MP4DiagnosticTool
        visible={showDiagnostic}
        onClose={() => setShowDiagnostic(false)}
        onLoadVideo={(url) => {
          console.log('[VoiceSettings] ========== Load video from diagnostic ==========');
          console.log('[VoiceSettings] URI:', url);
          console.log('[VoiceSettings] Is local file:', url.startsWith('file://'));
          
          // Close diagnostic and show player directly
          setShowDiagnostic(false);
          setVideoUri(url);
          setShowPlayer(true);
        }}
      />
      
      {/* Inline Video Player Modal */}
      <Modal
        visible={showPlayer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlayer(false)}
      >
        <View style={styles.playerModalOverlay}>
          <View style={styles.playerModalContent}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerTitle}>視頻播放</Text>
              <Pressable
                onPress={() => {
                  setShowPlayer(false);
                  setVideoUri(null);
                }}
                style={styles.closePlayerButton}
              >
                <X size={24} color={Colors.primary.text} />
              </Pressable>
            </View>
            
            {videoUri && (
              <View style={styles.playerContainer}>
                <MP4Player
                  uri={videoUri}
                  autoPlay={true}
                  onError={(error) => {
                    console.error('[VoiceSettings] Player error:', error);
                    Alert.alert('播放錯誤', error);
                  }}
                  onPlaybackStart={() => {
                    console.log('[VoiceSettings] ✅ Playback started successfully');
                  }}
                />
              </View>
            )}
            
            <View style={styles.playerInfoBox}>
              <Text style={styles.playerInfoLabel}>視頻路徑：</Text>
              <Text style={styles.playerInfoText} numberOfLines={3}>
                {videoUri}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary.bg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.accent + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: Colors.primary.text,
    fontWeight: "500" as const,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  diagnosticItem: {
    borderColor: Colors.primary.accent + "40",
    borderWidth: 1.5,
  },
  diagnosticIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  diagnosticTextContainer: {
    flex: 1,
    gap: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
  },
  playerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerModalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: Colors.primary.bg,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary.text,
  },
  closePlayerButton: {
    padding: 8,
  },
  playerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  playerInfoBox: {
    padding: 12,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  playerInfoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary.textSecondary,
    marginBottom: 4,
  },
  playerInfoText: {
    fontSize: 11,
    color: Colors.primary.text,
    fontFamily: 'monospace' as const,
  },
});

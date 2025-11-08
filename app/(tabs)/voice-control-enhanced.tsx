import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Mic,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Monitor,
  Gauge,
  Settings,
  Info,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoiceControl } from "@/providers/VoiceControlProvider";

export default function VoiceControlEnhancedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const voiceControl = useVoiceControl();
  const {
    isListening = false,
    startListening = () => Promise.resolve(),
    stopListening = () => Promise.resolve(),
    lastCommand = null,
    isProcessing = false,
    alwaysListening = false,
    toggleAlwaysListening = () => Promise.resolve(),
    usageCount = 0,
  } = voiceControl || {};

  const [customCommand, setCustomCommand] = useState("");
  const [customAction, setCustomAction] = useState("");
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isListening || alwaysListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, alwaysListening, pulseAnim]);

  const commandCategories = [
    {
      title: t("playback_control"),
      icon: Play,
      commands: [
        { name: t("play"), example: t("play_example") },
        { name: t("pause"), example: t("pause_example") },
        { name: t("stop"), example: t("stop_example") },
        { name: t("next_video"), example: t("next_example") },
        { name: t("previous_video"), example: t("previous_example") },
        { name: t("replay"), example: t("replay_example") },
      ],
    },
    {
      title: t("progress_control"),
      icon: SkipForward,
      commands: [
        { name: t("forward_10s"), example: t("forward_10s_example") },
        { name: t("forward_20s"), example: t("forward_20s_example") },
        { name: t("forward_30s"), example: t("forward_30s_example") },
        { name: t("rewind_10s"), example: t("rewind_10s_example") },
        { name: t("rewind_20s"), example: t("rewind_20s_example") },
        { name: t("rewind_30s"), example: t("rewind_30s_example") },
      ],
    },
    {
      title: t("volume_control"),
      icon: Volume2,
      commands: [
        { name: t("max_volume"), example: t("max_volume_example") },
        { name: t("mute"), example: t("mute_example") },
        { name: t("unmute"), example: t("unmute_example") },
        { name: t("volume_up"), example: t("volume_up_example") },
        { name: t("volume_down"), example: t("volume_down_example") },
      ],
    },
    {
      title: t("screen_control"),
      icon: Monitor,
      commands: [
        { name: t("fullscreen"), example: t("fullscreen_example") },
        { name: t("exit_fullscreen"), example: t("exit_fullscreen_example") },
      ],
    },
    {
      title: t("playback_speed"),
      icon: Gauge,
      commands: [
        { name: t("speed_0_5"), example: t("speed_0_5_example") },
        { name: t("normal_speed"), example: t("normal_speed_example") },
        { name: t("speed_1_25"), example: t("speed_1_25_example") },
        { name: t("speed_1_5"), example: t("speed_1_5_example") },
        { name: t("speed_2_0"), example: t("speed_2_0_example") },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerIconContainer}>
            <Mic size={40} color={Colors.accent.primary} />
          </View>
          <Text style={styles.headerTitle}>{t("voice_control")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("voice_control_instruction")}
          </Text>
        </View>

        <View style={styles.gradientCard}>
          <View style={styles.cardInner}>
            <View style={styles.voiceSection}>
              <Text style={styles.sectionLabel}>{t("voice_assistant")}</Text>

              <View style={styles.micButtonContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.micButton,
                      (isListening || alwaysListening) &&
                        styles.micButtonActive,
                    ]}
                    onPress={async () => {
                      await toggleAlwaysListening();
                    }}
                    activeOpacity={0.8}
                  >
                    <Mic size={48} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <Text style={styles.micStatus}>
                {alwaysListening
                  ? t("continuous_listening")
                  : t("tap_to_speak")}
              </Text>

              {lastCommand && (
                <View style={styles.commandBadge}>
                  <Text style={styles.commandBadgeText}>
                    {t("last_command")}: {lastCommand}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.alwaysListenSection}>
              <View style={styles.alwaysListenLeft}>
                <Text style={styles.alwaysListenLabel}>
                  {t("always_listen")}
                </Text>
                <Text style={styles.alwaysListenHint}>
                  {t("continuous_voice_detection")}
                </Text>
              </View>
              <Switch
                value={alwaysListening}
                onValueChange={toggleAlwaysListening}
                trackColor={{
                  false: Colors.card.border,
                  true: Colors.accent.primary,
                }}
                thumbColor="white"
                ios_backgroundColor={Colors.card.border}
              />
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{usageCount}</Text>
                <Text style={styles.statLabel}>{t("commands_used")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>2000</Text>
                <Text style={styles.statLabel}>{t("monthly_limit")}</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((usageCount / 2000) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.customCommandSection}>
          <Text style={styles.sectionTitle}>{t("custom_commands")}</Text>
          <View style={styles.gradientCard}>
            <View style={styles.cardInner}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("command_name")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("custom_command_placeholder")}
                  placeholderTextColor={Colors.primary.textSecondary}
                  value={customCommand}
                  onChangeText={setCustomCommand}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("action")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("action_placeholder")}
                  placeholderTextColor={Colors.primary.textSecondary}
                  value={customAction}
                  onChangeText={setCustomAction}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!customCommand.trim() || !customAction.trim()) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={() => {
                  if (customCommand.trim() && customAction.trim()) {
                    console.log("Custom command saved:", {
                      customCommand,
                      customAction,
                    });
                    setCustomCommand("");
                    setCustomAction("");
                  }
                }}
                disabled={!customCommand.trim() || !customAction.trim()}
              >
                <Text style={styles.submitButtonText}>{t("add")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.commandListSection}>
          <Text style={styles.sectionTitle}>{t("available_commands")}</Text>
          {commandCategories.map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIconContainer}>
                  <category.icon size={24} color={Colors.accent.primary} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              {category.commands.map((cmd, cmdIndex) => (
                <View key={cmdIndex} style={styles.commandItem}>
                  <View style={styles.commandDot} />
                  <Text style={styles.commandName}>{cmd.name}</Text>
                  <Text style={styles.commandExample}>{cmd.example}</Text>
                </View>
              ))}
            </View>
          ))}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 20,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    textAlign: "center",
  },
  gradientCard: {
    background: "linear-gradient(#212121, #212121) padding-box, linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box",
    borderRadius: 16,
    padding: 2,
    marginBottom: 24,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "transparent",
    borderStyle: "solid" as const,
  } as any,
  cardInner: {
    backgroundColor: "#212121",
    borderRadius: 14,
    padding: 24,
  },
  voiceSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#717171",
    marginBottom: 16,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  micButtonContainer: {
    marginBottom: 16,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  micButtonActive: {
    backgroundColor: "#e81cff",
    shadowColor: "#e81cff",
  },
  micStatus: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    textAlign: "center",
  },
  commandBadge: {
    marginTop: 12,
    backgroundColor: "rgba(232, 28, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  commandBadgeText: {
    fontSize: 14,
    color: "#e81cff",
    fontWeight: "500" as const,
  },
  alwaysListenSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#414141",
    marginBottom: 24,
  },
  alwaysListenLeft: {
    flex: 1,
  },
  alwaysListenLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 4,
  },
  alwaysListenHint: {
    fontSize: 13,
    color: "#717171",
  },
  statsSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#717171",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#414141",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#414141",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#40c9ff",
    borderRadius: 4,
  },
  customCommandSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#717171",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#414141",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#313131",
    borderWidth: 1,
    borderColor: "#414141",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#717171",
  },
  commandListSection: {
    marginBottom: 32,
  },
  categoryCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
  },
  commandItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  commandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.primary,
    marginRight: 12,
  },
  commandName: {
    flex: 1,
    fontSize: 15,
    color: Colors.primary.text,
    fontWeight: "500" as const,
  },
  commandExample: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    backgroundColor: Colors.card.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

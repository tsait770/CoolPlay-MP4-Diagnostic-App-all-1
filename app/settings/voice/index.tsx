import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Mic, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

export default function VoiceIndexScreen() {
  const router = useRouter();
  const { t } = useTranslation();

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
      </ScrollView>
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
});

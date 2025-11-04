import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Mic, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import BlackButton from "@/components/BlackButton";

export default function VoiceIndexScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.backButtonWrapper}>
          <BlackButton
            label="BACK"
            onPress={() => router.back()}
            style={styles.blackButton}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t("voice_control")}</Text>
        </View>
      </View>
      <ScrollView>
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.secondary.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonWrapper: {
    position: "absolute" as const,
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1000,
  },
  blackButton: {
    transform: [{ scale: 0.4 }],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
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

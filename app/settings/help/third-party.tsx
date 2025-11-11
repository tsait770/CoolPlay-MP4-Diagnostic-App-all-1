import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { Stack } from "expo-router";
import { ExternalLink } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

export default function ThirdPartyServicesScreen() {
  const { t } = useTranslation();

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("third_party_services"),
          headerStyle: { backgroundColor: Colors.primary.bg },
          headerTintColor: Colors.primary.text,
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.intro}>
            {t("third_party_intro")}
          </Text>

          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>YouTube</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t("video_platform")}</Text>
              </View>
            </View>
            
            <Text style={styles.serviceDescription}>
              {t("youtube_service_desc")}
            </Text>

            <View style={styles.complianceBox}>
              <Text style={styles.complianceTitle}>{t("compliance_measures")}:</Text>
              <Text style={styles.complianceItem}>✓ {t("youtube_official_embed")}</Text>
              <Text style={styles.complianceItem}>✓ {t("youtube_api_compliant")}</Text>
              <Text style={styles.complianceItem}>✓ {t("youtube_branding_preserved")}</Text>
              <Text style={styles.complianceItem}>✓ {t("youtube_no_ad_removal")}</Text>
              <Text style={styles.complianceItem}>✓ {t("youtube_user_initiated")}</Text>
            </View>

            <Text style={styles.dataUsageTitle}>{t("data_usage")}:</Text>
            <Text style={styles.dataUsageText}>
              {t("youtube_data_usage")}
            </Text>

            <View style={styles.linksContainer}>
              <Pressable
                style={styles.linkButton}
                onPress={() => openLink("https://policies.google.com/privacy")}
              >
                <Text style={styles.linkText}>Google Privacy Policy</Text>
                <ExternalLink size={16} color={Colors.primary.accent} />
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={() => openLink("https://www.youtube.com/t/terms")}
              >
                <Text style={styles.linkText}>YouTube Terms of Service</Text>
                <ExternalLink size={16} color={Colors.primary.accent} />
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={() => openLink("https://developers.google.com/youtube/terms/api-services-terms-of-service")}
              >
                <Text style={styles.linkText}>YouTube API Services Terms</Text>
                <ExternalLink size={16} color={Colors.primary.accent} />
              </Pressable>
            </View>
          </View>

          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>Vimeo</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t("video_platform")}</Text>
              </View>
            </View>
            
            <Text style={styles.serviceDescription}>
              {t("vimeo_service_desc")}
            </Text>

            <View style={styles.linksContainer}>
              <Pressable
                style={styles.linkButton}
                onPress={() => openLink("https://vimeo.com/privacy")}
              >
                <Text style={styles.linkText}>Vimeo Privacy Policy</Text>
                <ExternalLink size={16} color={Colors.primary.accent} />
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={() => openLink("https://vimeo.com/terms")}
              >
                <Text style={styles.linkText}>Vimeo Terms of Service</Text>
                <ExternalLink size={16} color={Colors.primary.accent} />
              </Pressable>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>{t("important_notice")}</Text>
            <Text style={styles.noticeText}>
              {t("third_party_notice")}
            </Text>
          </View>

          <Text style={styles.updateInfo}>
            {t("last_updated")}: 2025-01-11
          </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  intro: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  serviceCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
  },
  badge: {
    backgroundColor: `${Colors.primary.accent}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary.accent,
    textTransform: "uppercase" as const,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  complianceBox: {
    backgroundColor: `${Colors.semantic.success}10`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.semantic.success,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  complianceItem: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    marginLeft: 4,
  },
  dataUsageTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  dataUsageText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  linksContainer: {
    gap: 8,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${Colors.primary.accent}08`,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary.accent}20`,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.primary.accent,
  },
  noticeBox: {
    backgroundColor: `${Colors.semantic.warning}10`,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.semantic.warning,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  updateInfo: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic" as const,
  },
});

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("privacy_policy"),
          headerStyle: { backgroundColor: Colors.primary.bg },
          headerTintColor: Colors.primary.text,
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>{t("last_updated")}: 2025-01-11</Text>

          <Text style={styles.sectionTitle}>{t("introduction")}</Text>
          <Text style={styles.paragraph}>
            {t("privacy_policy_intro")}
          </Text>

          <Text style={styles.sectionTitle}>{t("information_we_collect")}</Text>
          <Text style={styles.paragraph}>
            {t("information_we_collect_desc")}
          </Text>
          <Text style={styles.bulletPoint}>• {t("account_information")}</Text>
          <Text style={styles.bulletPoint}>• {t("usage_data")}</Text>
          <Text style={styles.bulletPoint}>• {t("device_information")}</Text>

          <Text style={styles.sectionTitle}>{t("how_we_use_information")}</Text>
          <Text style={styles.paragraph}>
            {t("how_we_use_information_desc")}
          </Text>
          <Text style={styles.bulletPoint}>• {t("provide_services")}</Text>
          <Text style={styles.bulletPoint}>• {t("improve_app")}</Text>
          <Text style={styles.bulletPoint}>• {t("communicate_with_you")}</Text>

          <Text style={styles.sectionTitle}>{t("third_party_services")}</Text>
          <Text style={styles.paragraph}>
            {t("third_party_services_desc")}
          </Text>
          <Text style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>YouTube API Services{'\n'}</Text>
            <Text style={styles.highlightText}>
              {t("youtube_api_notice")}
            </Text>
            <Text style={styles.highlightText}>
              {'\n\n'}• Google Privacy Policy: https://policies.google.com/privacy
            </Text>
            <Text style={styles.highlightText}>
              {'\n'}• YouTube Terms of Service: https://www.youtube.com/t/terms
            </Text>
          </Text>

          <Text style={styles.sectionTitle}>{t("data_storage")}</Text>
          <Text style={styles.paragraph}>
            {t("data_storage_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("your_rights")}</Text>
          <Text style={styles.paragraph}>
            {t("your_rights_desc")}
          </Text>
          <Text style={styles.bulletPoint}>• {t("access_your_data")}</Text>
          <Text style={styles.bulletPoint}>• {t("delete_your_data")}</Text>
          <Text style={styles.bulletPoint}>• {t("opt_out")}</Text>

          <Text style={styles.sectionTitle}>{t("contact_us")}</Text>
          <Text style={styles.paragraph}>
            {t("privacy_contact")}
          </Text>
          <Text style={styles.contactInfo}>support@coolplay.com</Text>
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
  lastUpdated: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginBottom: 20,
    fontStyle: "italic" as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    lineHeight: 24,
    marginLeft: 8,
  },
  highlightBox: {
    backgroundColor: `${Colors.primary.accent}10`,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.accent,
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary.text,
  },
  highlightText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    lineHeight: 20,
  },
  contactInfo: {
    fontSize: 14,
    color: Colors.primary.accent,
    fontWeight: "600" as const,
    marginTop: 8,
  },
});

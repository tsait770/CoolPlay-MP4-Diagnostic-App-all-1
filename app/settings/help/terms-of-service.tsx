import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

export default function TermsOfServiceScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("terms_of_service"),
          headerStyle: { backgroundColor: Colors.primary.bg },
          headerTintColor: Colors.primary.text,
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>{t("last_updated")}: 2025-01-11</Text>

          <Text style={styles.sectionTitle}>{t("acceptance_of_terms")}</Text>
          <Text style={styles.paragraph}>
            {t("acceptance_of_terms_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("use_of_service")}</Text>
          <Text style={styles.paragraph}>
            {t("use_of_service_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("youtube_content")}</Text>
          <Text style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>YouTube Compliance{'\n'}</Text>
            <Text style={styles.highlightText}>
              {t("youtube_compliance_notice")}
            </Text>
            <Text style={styles.highlightText}>
              {'\n\n'}• {t("youtube_embed_only")}
            </Text>
            <Text style={styles.highlightText}>
              {'\n'}• {t("youtube_no_download")}
            </Text>
            <Text style={styles.highlightText}>
              {'\n'}• {t("youtube_respect_restrictions")}
            </Text>
            <Text style={styles.highlightText}>
              {'\n'}• {t("youtube_ads_intact")}
            </Text>
            <Text style={styles.highlightText}>
              {'\n\n'}{t("youtube_tos_binding")}
            </Text>
          </Text>

          <Text style={styles.sectionTitle}>{t("user_content")}</Text>
          <Text style={styles.paragraph}>
            {t("user_content_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("prohibited_activities")}</Text>
          <Text style={styles.paragraph}>
            {t("prohibited_activities_desc")}
          </Text>
          <Text style={styles.bulletPoint}>• {t("no_illegal_content")}</Text>
          <Text style={styles.bulletPoint}>• {t("no_copyright_violation")}</Text>
          <Text style={styles.bulletPoint}>• {t("no_abuse")}</Text>
          <Text style={styles.bulletPoint}>• {t("no_circumvent")}</Text>

          <Text style={styles.sectionTitle}>{t("intellectual_property")}</Text>
          <Text style={styles.paragraph}>
            {t("intellectual_property_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("disclaimer")}</Text>
          <Text style={styles.paragraph}>
            {t("disclaimer_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("limitation_of_liability")}</Text>
          <Text style={styles.paragraph}>
            {t("limitation_of_liability_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("changes_to_terms")}</Text>
          <Text style={styles.paragraph}>
            {t("changes_to_terms_desc")}
          </Text>

          <Text style={styles.sectionTitle}>{t("contact_us")}</Text>
          <Text style={styles.paragraph}>
            {t("terms_contact")}
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

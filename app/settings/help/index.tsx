import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { HelpCircle, Info, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

export default function HelpIndexScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const helpItems = [
    {
      icon: HelpCircle,
      label: t("faq"),
      route: "/settings/help/faq",
    },
    {
      icon: HelpCircle,
      label: t("tutorial"),
      route: "/settings/help/tutorial",
    },
    {
      icon: HelpCircle,
      label: t("contact_us"),
      route: "/settings/help/contact",
    },
    {
      icon: Info,
      label: t("privacy_policy"),
      route: "/settings/help/privacy-policy",
    },
    {
      icon: Info,
      label: t("terms_of_service"),
      route: "/settings/help/terms-of-service",
    },
    {
      icon: Info,
      label: t("third_party_services"),
      route: "/settings/help/third-party",
    },
    {
      icon: Info,
      label: t("about"),
      route: "/settings/help/about",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        {helpItems.map((item, index) => {
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

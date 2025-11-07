import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import {
  User,
  CreditCard,
  Smartphone,
  Moon,
  Globe,
  Cloud,
  Brain,
  Bell,
  Shield,
  Lock,
  Mic,
  HelpCircle,
  Info,
  ChevronRight,
  Gift,
  Settings as SettingsIcon,
  Code,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useReferral } from "@/providers/ReferralProvider";

const AnimatedSettingItem: React.FC<{
  onPress: () => void;
  children: React.ReactNode;
  testID?: string;
}> = ({ onPress, children, testID }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      android_ripple={{ color: "rgba(108,212,255,0.15)", borderless: false }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      testID={testID}
    >
      <Animated.View
        style={[styles.settingItem, { transform: [{ scale }], opacity }]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { userData } = useReferral();

  type SettingItem = {
    icon: any;
    label: string;
    route: string;
    value?: string;
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: t("account_settings"),
      items: [
        { icon: User, label: t("account_info"), route: "/settings/account/profile" },
        { icon: CreditCard, label: t("subscription_plan"), route: "/settings/account/membership" },
        {
          icon: Gift,
          label: t("enter_referral_code"),
          route: "/settings/account/referral",
          value: userData.hasUsedReferralCode ? t("code_used") : undefined,
        },
        { icon: Smartphone, label: t("device_management"), route: "/settings/account/devices" },
      ],
    },
    {
      title: t("appearance_language"),
      items: [
        { icon: Moon, label: t("dark_mode"), route: "/settings/appearance/theme" },
        { icon: Globe, label: t("language"), route: "/settings/appearance/language" },
      ],
    },
    {
      title: t("data_management"),
      items: [
        { icon: Cloud, label: t("data_management"), route: "/settings/data/index" },
      ],
    },
    {
      title: t("smart_classification"),
      items: [
        { icon: Brain, label: t("classification_overview"), route: "/settings/classification/index" },
        { icon: SettingsIcon, label: t("manage_classification_rules"), route: "/settings/classification/rules" },
        { icon: SettingsIcon, label: t("advanced_classification_settings"), route: "/settings/classification/advanced" },
      ],
    },
    {
      title: t("sync_settings"),
      items: [
        { icon: Cloud, label: t("sync_settings"), route: "/settings/sync/index" },
      ],
    },
    {
      title: t("notification_settings"),
      items: [
        { icon: Bell, label: t("notification_management"), route: "/settings/notifications/index" },
      ],
    },
    {
      title: t("privacy_security"),
      items: [
        { icon: Lock, label: t("biometric_lock"), route: "/settings/security/app-lock" },
        { icon: Shield, label: t("privacy_settings"), route: "/settings/security/privacy" },
      ],
    },
    {
      title: t("voice_control"),
      items: [
        { icon: Mic, label: t("voice_settings"), route: "/settings/voice/index" },
        { icon: Mic, label: t("custom_commands"), route: "/settings/voice/commands" },
        { icon: Mic, label: t("siri_voice_assistant"), route: "/settings/voice/assistant" },
      ],
    },
    {
      title: t("help_support"),
      items: [
        { icon: HelpCircle, label: t("faq"), route: "/settings/help/faq" },
        { icon: HelpCircle, label: t("tutorial"), route: "/settings/help/tutorial" },
        { icon: HelpCircle, label: t("contact_us"), route: "/settings/help/contact" },
        { icon: Info, label: t("about"), route: "/settings/help/about" },
      ],
    },
    {
      title: t("developer_options"),
      items: [
        { icon: Code, label: t("admin_panel"), route: "/settings/developer/admin" },
        { icon: Code, label: t("category_management"), route: "/settings/developer/category-management" },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <AnimatedSettingItem
                  key={itemIndex}
                  onPress={() => router.push(item.route as any)}
                  testID={`settingItem-${item.route}`}
                >
                  <View style={styles.settingContent}>
                    <Icon size={20} color={Colors.primary.accent} />
                    <Text style={styles.settingText}>{item.label}</Text>
                  </View>
                  <View style={styles.settingRight}>
                    {item.value ? (
                      <Text style={styles.settingValue}>{item.value}</Text>
                    ) : (
                      <ChevronRight
                        size={20}
                        color={Colors.primary.textSecondary}
                      />
                    )}
                  </View>
                </AnimatedSettingItem>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: Colors.primary.text,
    flex: 1,
    fontWeight: "500" as const,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    marginRight: 5,
  },
});

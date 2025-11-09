import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";

export default function SettingsLayout() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary.bg,
        },
        headerTintColor: Colors.primary.text,
        headerTitleStyle: {
          fontWeight: "700" as const,
          fontSize: 20,
          color: Colors.primary.text,
        },
        headerShadowVisible: false,
        headerBackTitle: t("back"),
        headerBackVisible: true,
        contentStyle: {
          backgroundColor: Colors.primary.bg,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("settings"),
          headerShown: true,
          headerBackVisible: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: -8, padding: 8 }}
            >
              <ChevronLeft size={24} color={Colors.primary.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="account/index"
        options={{
          title: t("account_settings"),
        }}
      />
      <Stack.Screen
        name="account/login"
        options={{
          title: t("login"),
        }}
      />
      <Stack.Screen
        name="account/profile"
        options={{
          title: t("account_info"),
        }}
      />
      <Stack.Screen
        name="account/membership"
        options={{
          title: t("subscription_plan"),
        }}
      />
      <Stack.Screen
        name="account/referral"
        options={{
          title: t("enter_referral_code"),
        }}
      />
      <Stack.Screen
        name="account/devices"
        options={{
          title: t("device_management"),
        }}
      />
      <Stack.Screen
        name="appearance/index"
        options={{
          title: t("appearance_language"),
        }}
      />
      <Stack.Screen
        name="appearance/theme"
        options={{
          title: t("dark_mode"),
        }}
      />
      <Stack.Screen
        name="appearance/language"
        options={{
          title: t("language"),
        }}
      />
      <Stack.Screen
        name="data/index"
        options={{
          title: t("data_management"),
        }}
      />
      <Stack.Screen
        name="data/backup"
        options={{
          title: t("auto_backup"),
        }}
      />
      <Stack.Screen
        name="data/import-export"
        options={{
          title: t("import_export"),
        }}
      />
      <Stack.Screen
        name="data/cache"
        options={{
          title: t("clear_cache"),
        }}
      />
      <Stack.Screen
        name="classification/index"
        options={{
          title: t("smart_classification"),
        }}
      />
      <Stack.Screen
        name="classification/rules"
        options={{
          title: t("manage_classification_rules"),
        }}
      />
      <Stack.Screen
        name="classification/advanced"
        options={{
          title: t("advanced_classification_settings"),
        }}
      />
      <Stack.Screen
        name="sync/index"
        options={{
          title: t("sync_settings"),
        }}
      />
      <Stack.Screen
        name="sync/service"
        options={{
          title: t("sync_service"),
        }}
      />
      <Stack.Screen
        name="sync/frequency"
        options={{
          title: t("sync_frequency"),
        }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{
          title: t("notification_settings"),
        }}
      />
      <Stack.Screen
        name="security/index"
        options={{
          title: t("privacy_security"),
        }}
      />
      <Stack.Screen
        name="security/app-lock"
        options={{
          title: t("biometric_lock"),
        }}
      />
      <Stack.Screen
        name="security/privacy"
        options={{
          title: t("privacy_settings"),
        }}
      />
      <Stack.Screen
        name="voice/index"
        options={{
          title: t("voice_control"),
        }}
      />
      <Stack.Screen
        name="voice/commands"
        options={{
          title: t("custom_commands"),
        }}
      />
      <Stack.Screen
        name="voice/assistant"
        options={{
          title: t("siri_voice_assistant"),
        }}
      />
      <Stack.Screen
        name="help/index"
        options={{
          title: t("help_support"),
        }}
      />
      <Stack.Screen
        name="help/faq"
        options={{
          title: t("faq"),
        }}
      />
      <Stack.Screen
        name="help/contact"
        options={{
          title: t("contact_us"),
        }}
      />
      <Stack.Screen
        name="help/tutorial"
        options={{
          title: t("tutorial"),
        }}
      />
      <Stack.Screen
        name="help/about"
        options={{
          title: t("about"),
        }}
      />
      <Stack.Screen
        name="developer/index"
        options={{
          title: t("developer_options"),
        }}
      />
      <Stack.Screen
        name="developer/admin"
        options={{
          title: t("admin_panel"),
        }}
      />
      <Stack.Screen
        name="developer/category-management"
        options={{
          title: t("category_management"),
        }}
      />
      <Stack.Screen
        name="developer/api"
        options={{
          title: t("api_settings"),
        }}
      />
      <Stack.Screen
        name="developer/logs"
        options={{
          title: t("debug_logs"),
        }}
      />
      <Stack.Screen
        name="developer/experimental"
        options={{
          title: t("experimental_features"),
        }}
      />
    </Stack>
  );
}

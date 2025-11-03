import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";

export default function TabLayout() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  // Force re-render when language changes by using it as a dependency
  const tabOptions = useMemo(() => ({
    home: {
      title: t("home"),
      tabBarIcon: ({ color }: { color: string }) => (
        <Ionicons name="home-outline" size={24} color={color} />
      ),
    },
    favorites: {
      title: t("favorites"),
      tabBarIcon: ({ color }: { color: string }) => (
        <Ionicons name="star-outline" size={24} color={color} />
      ),
    },
    player: {
      title: t("voice_control"),
      tabBarIcon: ({ color }: { color: string }) => (
        <Ionicons name="mic-outline" size={24} color={color} />
      ),
    },
    community: {
      title: t("community_share"),
      tabBarIcon: ({ color }: { color: string }) => (
        <Ionicons name="share-outline" size={24} color={color} />
      ),
    },
    settings: {
      title: t("settings"),
      tabBarIcon: ({ color }: { color: string }) => (
        <Ionicons name="settings-outline" size={24} color={color} />
      ),
    },
  }), [t]);
  
  return (
    <Tabs
      key={language}
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.accent,
        tabBarInactiveTintColor: Colors.primary.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.secondary.bg,
          borderTopColor: Colors.card.border,
          borderTopWidth: 1,
          elevation: 999,
          zIndex: 1000,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          paddingBottom: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarButton: (props: any) => (
          <TouchableOpacity
            {...props}
            hitSlop={{ top: 10, bottom: 14, left: 10, right: 10 }}
          />
        ),
        tabBarHideOnKeyboard: true,
        headerStyle: {
          backgroundColor: Colors.secondary.bg,
          borderBottomColor: Colors.card.border,
          borderBottomWidth: 1,
        },
        headerTintColor: Colors.primary.text,
        headerTitleStyle: {
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={tabOptions.home}
        listeners={{
          tabPress: () => {
            console.log('[Tabs] tabPress: home', Date.now());
          },
        } as any}
      />
      <Tabs.Screen
        name="favorites"
        options={tabOptions.favorites}
        listeners={{
          tabPress: () => {
            console.log('[Tabs] tabPress: favorites', Date.now());
          },
        } as any}
      />
      <Tabs.Screen
        name="player"
        options={tabOptions.player}
        listeners={{
          tabPress: () => {
            console.log('[Tabs] tabPress: player', Date.now());
          },
        } as any}
      />
      <Tabs.Screen
        name="community"
        options={tabOptions.community}
        listeners={{
          tabPress: () => {
            console.log('[Tabs] tabPress: community', Date.now());
          },
        } as any}
      />
      <Tabs.Screen
        name="settings"
        options={tabOptions.settings}
        listeners={{
          tabPress: () => {
            console.log('[Tabs] tabPress: settings', Date.now());
          },
        } as any}
      />

    </Tabs>
  );
}
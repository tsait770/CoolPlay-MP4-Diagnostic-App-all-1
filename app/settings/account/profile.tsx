import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AtSign, Lock, LogOut, Chrome, Apple } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/providers/AuthProvider";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [linkingGoogle, setLinkingGoogle] = useState(false);



  const handleSignIn = () => {
    if (!email || !password) {
      Alert.alert(t("error"), "Please enter both email and password");
      return;
    }
    Alert.alert(t("success"), "Sign in successful");
  };

  const handleForgotPassword = () => {
    Alert.alert(t("forgot_password"), t("password_reset_sent"));
  };

  const handleSignUp = () => {
    Alert.alert(t("info"), "Navigate to Sign Up");
  };

  const handleGoogleAuth = async () => {
    setLinkingGoogle(true);
    const { error } = await signInWithGoogle();
    setLinkingGoogle(false);

    if (error) {
      Alert.alert(t("error"), t("google_link_failed"));
    } else {
      Alert.alert(t("success"), t("google_linked_success"));
    }
  };

  const handleAppleAuth = () => {
    Alert.alert(t("info"), "Apple Sign In coming soon");
  };

  const handleLogout = () => {
    Alert.alert(t("logout"), t("logout_confirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: () => {} },
    ]);
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputForm}>
            <AtSign size={22} color="#666" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your Email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputForm}>
            <Lock size={22} color="#666" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your Password"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.flexRow}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.buttonSubmit} onPress={handleSignIn}>
          <Text style={styles.buttonSubmitText}>Sign In</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <Text style={styles.signUpText}>
          Don&apos;t have an account?{" "}
          <Text style={styles.signUpLink} onPress={handleSignUp}>
            Sign Up
          </Text>
        </Text>

        {/* Or With Divider */}
        <Text style={styles.orWith}>Or With</Text>

        {/* Social Auth Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={handleGoogleAuth}
            disabled={linkingGoogle}
          >
            <Chrome size={24} color="#4A90E2" />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={handleAppleAuth}
          >
            <Apple size={24} color="#ffffff" />
            <Text style={styles.socialButtonText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>{t("logout")}</Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#1a1a1a",
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  flexColumn: {
    marginBottom: 20,
  },
  label: {
    color: "#ffffff",
    fontWeight: "600" as const,
    fontSize: 20,
    marginBottom: 12,
  },
  inputForm: {
    borderWidth: 0,
    borderRadius: 12,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: "#2a2a2a",
  },
  input: {
    marginLeft: 12,
    borderRadius: 12,
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#cccccc",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1a1a1a",
  },
  rememberText: {
    fontSize: 15,
    color: "#ffffff",
  },
  forgotPassword: {
    fontSize: 15,
    color: "#4A90E2",
    fontWeight: "500" as const,
  },
  buttonSubmit: {
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: "#4A90E2",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSubmitText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600" as const,
  },
  signUpText: {
    textAlign: "center" as const,
    color: "#ffffff",
    fontSize: 15,
    marginTop: 0,
    marginBottom: 20,
  },
  signUpLink: {
    color: "#4A90E2",
    fontWeight: "600" as const,
  },
  orWith: {
    textAlign: "center" as const,
    color: "#ffffff",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 0,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 0,
    backgroundColor: "#2a2a2a",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#ffffff",
  },
  logoutButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
});

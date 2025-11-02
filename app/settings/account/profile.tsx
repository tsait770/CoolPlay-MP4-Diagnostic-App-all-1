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
    <View style={[styles.outerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputForm}>
            <AtSign size={20} color="#999" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputForm}>
            <Lock size={20} color="#999" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your Password"
              placeholderTextColor="#999"
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
            <Chrome size={24} color="#4285F4" />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={handleAppleAuth}
          >
            <Apple size={24} color="#000" />
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  flexColumn: {
    marginBottom: 10,
  },
  label: {
    color: "#151717",
    fontWeight: "600" as const,
    fontSize: 16,
    marginBottom: 8,
  },
  inputForm: {
    borderWidth: 1.5,
    borderColor: "#ecedec",
    borderRadius: 10,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
  },
  input: {
    marginLeft: 10,
    borderRadius: 10,
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#151717",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
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
    borderColor: "#ecedec",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    borderColor: "#2d79f3",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2d79f3",
  },
  rememberText: {
    fontSize: 14,
    color: "#151717",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#2d79f3",
    fontWeight: "500" as const,
  },
  buttonSubmit: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#151717",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSubmitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500" as const,
  },
  signUpText: {
    textAlign: "center" as const,
    color: "#151717",
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
  },
  signUpLink: {
    color: "#2d79f3",
    fontWeight: "500" as const,
  },
  orWith: {
    textAlign: "center" as const,
    color: "#151717",
    fontSize: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  socialButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#ededef",
    backgroundColor: "#ffffff",
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#151717",
  },
  logoutButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
});

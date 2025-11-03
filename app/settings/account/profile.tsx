import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, Lock, LogOut } from "lucide-react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/providers/AuthProvider";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [linkingApple, setLinkingApple] = useState(false);



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
    try {
      setLinkingGoogle(true);
      console.log('開始 Google 認證...');
      const result = await signInWithGoogle();
      console.log('Google 認證結果:', result);

      if (result.error) {
        console.error('Google 認證錯誤:', result.error);
        Alert.alert(
          "Google 認證失敗",
          result.error.message || "無法完成 Google 登入，請稍後再試"
        );
      } else {
        console.log('Google 認證成功');
        Alert.alert("成功", "Google 帳號連結成功！");
      }
    } catch (error) {
      console.error('處理 Google 認證時發生錯誤:', error);
      Alert.alert("錯誤", "發生未預期的錯誤，請稍後再試");
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleAppleAuth = async () => {
    setLinkingApple(true);
    setTimeout(() => {
      setLinkingApple(false);
      Alert.alert(t("info"), "Apple Sign In coming soon");
    }, 500);
  };

  const handleLogout = () => {
    Alert.alert(t("logout"), t("logout_confirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: () => {} },
    ]);
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingTop: 60, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputForm}>
            <Mail size={20} color="#8A8A8A" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your Email"
              placeholderTextColor="#8A8A8A"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.flexColumn}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputForm}>
            <Lock size={20} color="#8A8A8A" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your Password"
              placeholderTextColor="#8A8A8A"
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
            style={[styles.socialButton, linkingGoogle && styles.socialButtonDisabled]}
            onPress={handleGoogleAuth}
            disabled={linkingGoogle}
          >
            {linkingGoogle ? (
              <ActivityIndicator size="small" color={Colors.primary.text} />
            ) : (
              <>
                <Image 
                  source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" }}
                  style={styles.socialIcon}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  priority="high"
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, linkingApple && styles.socialButtonDisabled]}
            onPress={handleAppleAuth}
            disabled={linkingApple}
          >
            {linkingApple ? (
              <ActivityIndicator size="small" color={Colors.primary.text} />
            ) : (
              <>
                <Image 
                  source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" }}
                  style={styles.socialIcon}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  priority="high"
                />
                <Text style={styles.socialButtonText}>Apple</Text>
              </>
            )}
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
    backgroundColor: Colors.primary.bg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: Colors.primary.bg,
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  flexColumn: {
    marginBottom: 20,
  },
  label: {
    color: Colors.primary.text,
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
    backgroundColor: Colors.surface.secondary,
  },
  input: {
    marginLeft: 12,
    borderRadius: 12,
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: Colors.primary.textSecondary,
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
    borderColor: Colors.primary.text,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.primary.accent,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.text,
  },
  rememberText: {
    fontSize: 15,
    color: Colors.primary.text,
  },
  forgotPassword: {
    fontSize: 15,
    color: Colors.primary.accent,
    fontWeight: "500" as const,
  },
  buttonSubmit: {
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: Colors.primary.accent,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSubmitText: {
    color: Colors.primary.text,
    fontSize: 17,
    fontWeight: "600" as const,
  },
  signUpText: {
    textAlign: "center" as const,
    color: Colors.primary.text,
    fontSize: 15,
    marginTop: 0,
    marginBottom: 20,
  },
  signUpLink: {
    color: Colors.primary.accent,
    fontWeight: "600" as const,
  },
  orWith: {
    textAlign: "center" as const,
    color: Colors.primary.text,
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
    borderWidth: 1,
    borderColor: Colors.card.border,
    backgroundColor: Colors.surface.secondary,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.primary.text,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  logoutButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.semantic.danger,
  },
});

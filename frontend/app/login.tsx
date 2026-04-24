import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../src/AuthContext";
import { colors, spacing, radius } from "../src/theme";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>ATTENDO</Text>
            <Text style={styles.h1}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to track your attendance</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              testID="login-email-input"
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>PASSWORD</Text>
            <TextInput
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={styles.input}
            />

            {error ? (
              <Text testID="login-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="login-submit-button"
              onPress={onSubmit}
              disabled={loading}
              style={[styles.button, loading && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing in..." : "Sign in"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="goto-register-button"
              onPress={() => router.push("/register")}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>
                New here? <Text style={styles.linkAccent}>Create an account</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>DEMO ADMIN</Text>
              <Text style={styles.hintText}>admin@company.com / admin123</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  header: { marginBottom: spacing.xl, marginTop: spacing.xl },
  brand: {
    fontSize: 12,
    letterSpacing: 4,
    color: colors.brand,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  h1: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  form: { marginTop: spacing.lg },
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonText: { color: colors.textInverse, fontSize: 16, fontWeight: "600" },
  linkBtn: { marginTop: spacing.lg, alignItems: "center" },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  linkAccent: { color: colors.brand, fontWeight: "600" },
  hintBox: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  hintTitle: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  hintText: { fontSize: 13, color: colors.textPrimary, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});

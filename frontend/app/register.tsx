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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../src/AuthContext";
import { colors, spacing, radius } from "../src/theme";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    if (!name || !email || !password) {
      setError("Please fill all required fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), employeeId.trim() || undefined);
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "Registration failed");
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
            <Text style={styles.h1}>Create account</Text>
            <Text style={styles.subtitle}>Join your team in seconds</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              testID="register-name-input"
              value={name}
              onChangeText={setName}
              placeholder="Jane Doe"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>EMPLOYEE ID (OPTIONAL)</Text>
            <TextInput
              testID="register-empid-input"
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="EMP123"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>EMAIL</Text>
            <TextInput
              testID="register-email-input"
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
              testID="register-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={styles.input}
            />

            {error ? (
              <Text testID="register-error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="register-submit-button"
              onPress={onSubmit}
              disabled={loading}
              style={[styles.button, loading && { opacity: 0.6 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating account..." : "Create account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="goto-login-button"
              onPress={() => router.replace("/login")}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkAccent}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  header: { marginBottom: spacing.lg, marginTop: spacing.md },
  brand: {
    fontSize: 12,
    letterSpacing: 4,
    color: colors.brand,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  h1: { fontSize: 32, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.sm },
  form: { marginTop: spacing.md },
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
  error: { color: colors.danger, marginTop: spacing.md, fontSize: 14 },
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
});

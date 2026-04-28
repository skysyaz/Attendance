import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../AuthContext";
import { colors, spacing, radius } from "../theme";

type InfoRow = { label: string; value: string };

type Props = {
  brandLabel?: string;
  infoRows?: InfoRow[];
  rolePillLabel?: string;
  avatarBg?: string;
  testId?: string;
};

export default function ProfileScreen({
  brandLabel = "PROFILE",
  infoRows,
  rolePillLabel,
  avatarBg = colors.brand,
  testId = "logout-button",
}: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const displayRows: InfoRow[] = infoRows ?? [
    { label: "EMPLOYEE ID", value: user?.employee_id || "—" },
    { label: "ROLE", value: user?.role ?? "" },
  ];

  const pillLabel = rolePillLabel ?? user?.role?.toUpperCase() ?? "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>{brandLabel}</Text>
      </View>

      <View style={styles.profileBlock}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{pillLabel}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        {displayRows.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity testID={testId} onPress={handleLogout} style={styles.logoutBtn}>
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  brand: { fontSize: 11, letterSpacing: 3, color: colors.brand, fontWeight: "700" },
  profileBlock: { alignItems: "center", marginTop: spacing.md, marginBottom: spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: { color: "#FFF", fontSize: 36, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  rolePill: {
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 999,
  },
  roleText: { fontSize: 10, letterSpacing: 2, fontWeight: "700", color: colors.textPrimary },
  infoCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  infoLabel: { fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary, fontWeight: "600" },
  infoValue: { fontSize: 14, color: colors.textPrimary, fontWeight: "500" },
  divider: { height: 1, backgroundColor: colors.borderSubtle },
  logoutBtn: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
  },
  logoutText: { color: colors.danger, fontWeight: "600", fontSize: 15, marginLeft: 8 },
});

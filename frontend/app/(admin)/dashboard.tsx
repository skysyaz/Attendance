import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { api } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";
import { localToday } from "../../src/dateUtils";

type Record = {
  id: string;
  user_name: string;
  user_email: string;
  check_in_time: string;
  check_out_time?: string | null;
  check_in_address?: string;
  office_name?: string | null;
  hours_worked?: number | null;
};

type Stats = {
  total_staff: number;
  checked_in_today: number;
  active_now: number;
  total_offices: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const today = localToday();
      const [statsRes, recRes] = await Promise.all([
        api.get("/admin/stats", { params: { client_date: today } }),
        api.get("/attendance/all", { params: { date: today } }),
      ]);
      setStats(statsRes.data);
      setRecords(recRes.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <Text style={styles.brand}>ADMIN</Text>
        <Text style={styles.h1}>Overview</Text>
        <Text style={styles.date}>{format(new Date(), "EEEE, MMMM d")}</Text>

        <View style={styles.statsGrid}>
          <StatCard label="ACTIVE NOW" value={stats?.active_now ?? 0} tone={colors.success} testID="stat-active" />
          <StatCard label="CHECKED IN TODAY" value={stats?.checked_in_today ?? 0} testID="stat-today" />
          <StatCard label="TOTAL STAFF" value={stats?.total_staff ?? 0} testID="stat-staff" />
          <StatCard label="OFFICES" value={stats?.total_offices ?? 0} testID="stat-offices" />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>TODAY&apos;S ATTENDANCE</Text>
          <Text style={styles.sectionCount}>{records.length}</Text>
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="inbox" size={28} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No attendance records for today</Text>
          </View>
        ) : (
          records.map((r) => (
            <View key={r.id} style={styles.row} testID={`admin-row-${r.id}`}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{r.user_name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.user_name}</Text>
                <Text style={styles.email}>{r.user_email}</Text>
                <View style={styles.metaLine}>
                  <Feather
                    name={r.check_out_time ? "check-circle" : "clock"}
                    size={12}
                    color={r.check_out_time ? colors.textSecondary : colors.success}
                  />
                  <Text style={styles.metaText}>
                    {format(new Date(r.check_in_time), "HH:mm")}
                    {r.check_out_time ? ` → ${format(new Date(r.check_out_time), "HH:mm")}` : " → active"}
                  </Text>
                  {r.office_name ? <Text style={styles.officeName}>· {r.office_name}</Text> : null}
                </View>
              </View>
              <View style={styles.hoursPill}>
                <Text style={styles.hoursText}>
                  {r.hours_worked ? `${r.hours_worked.toFixed(1)}h` : "—"}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, tone, testID }: { label: string; value: number; tone?: string; testID?: string }) {
  return (
    <View style={styles.statCard} testID={testID}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 11, letterSpacing: 3, color: colors.brand, fontWeight: "700", marginBottom: 8 },
  h1: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  date: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.lg, marginHorizontal: -6 },
  statCard: {
    width: "50%",
    padding: 6,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, fontWeight: "700", color: colors.textPrimary },
  sectionCount: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  emptyBox: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    gap: 8,
  },
  emptyText: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  name: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metaLine: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  metaText: {
    fontSize: 12,
    color: colors.textPrimary,
    marginLeft: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  officeName: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  hoursPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  hoursText: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
});

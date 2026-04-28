import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { api } from "../../src/api";
import { colors, spacing } from "../../src/theme";

type AttendanceRecord = {
  id: string;
  check_in_time: string;
  check_out_time?: string | null;
  check_in_address?: string;
  office_name?: string | null;
  hours_worked?: number | null;
  date: string;
};

export default function History() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/attendance/me");
      setRecords(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const ci = new Date(item.check_in_time);
    const co = item.check_out_time ? new Date(item.check_out_time) : null;
    return (
      <View style={styles.row} testID={`history-row-${item.id}`}>
        <View style={styles.dateCol}>
          <Text style={styles.day}>{format(ci, "dd")}</Text>
          <Text style={styles.month}>{format(ci, "MMM").toUpperCase()}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{format(ci, "HH:mm")}</Text>
            <Feather name="arrow-right" size={14} color={colors.textSecondary} />
            <Text style={styles.time}>{co ? format(co, "HH:mm") : "--:--"}</Text>
            <View style={styles.hourPill}>
              <Text style={styles.hourText}>{item.hours_worked ? `${item.hours_worked.toFixed(2)}h` : "..."}</Text>
            </View>
          </View>
          {item.office_name ? (
            <View style={styles.metaRow}>
              <Feather name="briefcase" size={12} color={colors.textSecondary} />
              <Text style={styles.meta}>{item.office_name}</Text>
            </View>
          ) : null}
          {item.check_in_address ? (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={12} color={colors.textSecondary} />
              <Text style={styles.meta} numberOfLines={1}>
                {item.check_in_address}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>HISTORY</Text>
        <Text style={styles.h1}>Your attendance</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.center}>
          <Feather name="calendar" size={48} color={colors.textSecondary} />
          <Text style={styles.empty}>No attendance records yet</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  brand: { fontSize: 11, letterSpacing: 3, color: colors.brand, fontWeight: "700", marginBottom: 8 },
  h1: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.textSecondary, fontSize: 14, marginTop: spacing.md },
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: spacing.md },
  dateCol: {
    width: 60,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
    paddingRight: spacing.md,
  },
  day: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  month: { fontSize: 11, letterSpacing: 1, fontWeight: "600", color: colors.textSecondary },
  content: { flex: 1, paddingLeft: spacing.md },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  time: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginRight: 6,
  },
  hourPill: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  hourText: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  meta: { fontSize: 12, color: colors.textSecondary, marginLeft: 6, flex: 1 },
  separator: { height: 1, backgroundColor: colors.borderSubtle },
});

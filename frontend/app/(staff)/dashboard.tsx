import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { api, formatApiError } from "../../src/api";
import { useAuth } from "../../src/AuthContext";
import { colors, spacing, radius } from "../../src/theme";

type Record = {
  id: string;
  check_in_time: string;
  check_in_lat: number;
  check_in_lng: number;
  check_in_address?: string;
  check_out_time?: string | null;
  check_out_lat?: number | null;
  check_out_lng?: number | null;
  office_name?: string | null;
  hours_worked?: number | null;
};

type Office = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [record, setRecord] = useState<Record | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [todayRes, officesRes] = await Promise.all([
        api.get("/attendance/today"),
        api.get("/offices"),
      ]);
      setRecord(todayRes.data.record);
      setOffices(officesRes.data);
      if (!selectedOffice && officesRes.data.length > 0) {
        setSelectedOffice(officesRes.data[0].id);
      }
    } catch (e) {
      // silent
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }, [selectedOffice]);

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission denied. Please enable it in settings.");
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let address: string | undefined;
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (places.length > 0) {
        const p = places[0];
        address = [p.name, p.street, p.city, p.region].filter(Boolean).join(", ");
      }
    } catch {}
    return { lat: loc.coords.latitude, lng: loc.coords.longitude, address };
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { lat, lng, address } = await getLocation();
      const { data } = await api.post("/attendance/check-in", {
        latitude: lat,
        longitude: lng,
        address,
        office_id: selectedOffice,
      });
      setRecord(data);
      Alert.alert("Checked In", "Your attendance has been recorded.");
    } catch (e: any) {
      Alert.alert("Check-in failed", e.message || formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const { lat, lng, address } = await getLocation();
      const { data } = await api.post("/attendance/check-out", {
        latitude: lat,
        longitude: lng,
        address,
      });
      setRecord(data);
      Alert.alert("Checked Out", `Hours worked: ${data.hours_worked?.toFixed(2) || 0} h`);
    } catch (e: any) {
      Alert.alert("Check-out failed", e.message || formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!record && !record.check_out_time;
  const isCompleted = !!record && !!record.check_out_time;

  const hoursElapsed = record
    ? ((new Date(record.check_out_time || now).getTime() -
        new Date(record.check_in_time).getTime()) /
        (1000 * 60 * 60)).toFixed(2)
    : "0.00";

  if (fetching) {
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
        contentContainerStyle={styles.scroll}
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
        <View style={styles.header}>
          <Text style={styles.brand}>ATTENDO</Text>
          <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.date}>{format(now, "EEEE, MMMM d, yyyy")}</Text>
        </View>

        {/* Status card */}
        <View style={styles.card} testID="today-status-card">
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: isCheckedIn ? colors.success : colors.textSecondary }]} />
            <Text style={styles.statusLabel}>
              {isCheckedIn ? "CHECKED IN" : isCompleted ? "COMPLETED" : "NOT CHECKED IN"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CHECK-IN</Text>
              <Text style={styles.statValue}>
                {record ? format(new Date(record.check_in_time), "HH:mm") : "--:--"}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CHECK-OUT</Text>
              <Text style={styles.statValue}>
                {record?.check_out_time ? format(new Date(record.check_out_time), "HH:mm") : "--:--"}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>HOURS</Text>
              <Text style={styles.statValue}>{record ? hoursElapsed : "0.00"}</Text>
            </View>
          </View>

          {record?.check_in_address ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={2}>
                {record.check_in_address}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Office selector */}
        {!isCheckedIn && !isCompleted && offices.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT OFFICE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
              {offices.map((o) => {
                const active = o.id === selectedOffice;
                return (
                  <TouchableOpacity
                    key={o.id}
                    testID={`office-chip-${o.id}`}
                    onPress={() => setSelectedOffice(o.id)}
                    style={[
                      styles.chip,
                      active && { backgroundColor: colors.brand, borderColor: colors.brand },
                    ]}
                  >
                    <Text style={[styles.chipText, active && { color: colors.textInverse }]}>
                      {o.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Action button */}
        <View style={{ marginTop: spacing.xl }}>
          {!isCheckedIn && !isCompleted ? (
            <TouchableOpacity
              testID="check-in-button"
              onPress={handleCheckIn}
              disabled={loading}
              style={[styles.cta, { backgroundColor: colors.success }, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
            >
              <Feather name="log-in" size={22} color="#FFF" />
              <Text style={styles.ctaText}>{loading ? "Getting location..." : "Check in now"}</Text>
            </TouchableOpacity>
          ) : isCheckedIn ? (
            <TouchableOpacity
              testID="check-out-button"
              onPress={handleCheckOut}
              disabled={loading}
              style={[styles.cta, { backgroundColor: colors.danger }, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
            >
              <Feather name="log-out" size={22} color="#FFF" />
              <Text style={styles.ctaText}>{loading ? "Getting location..." : "Check out"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.cta, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }]}>
              <Feather name="check-circle" size={22} color={colors.success} />
              <Text style={[styles.ctaText, { color: colors.textPrimary }]}>Day complete</Text>
            </View>
          )}
        </View>

        <View style={styles.gpsHint}>
          <View style={[styles.dot, { backgroundColor: colors.success, marginRight: 8 }]} />
          <Text style={styles.gpsHintText}>GPS location will be captured automatically</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { marginBottom: spacing.lg },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: colors.brand,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  greeting: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  date: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  card: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    marginTop: spacing.md,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  statusLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: "700", color: colors.textPrimary },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  statItem: { flex: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.borderSubtle },
  statLabel: { fontSize: 10, letterSpacing: 1, color: colors.textSecondary, fontWeight: "600" },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  locationText: { flex: 1, fontSize: 12, color: colors.textSecondary, marginLeft: 6 },
  section: { marginTop: spacing.lg },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 999,
    marginRight: spacing.sm,
    backgroundColor: colors.bg,
  },
  chipText: { fontSize: 13, color: colors.textPrimary, fontWeight: "500" },
  cta: {
    borderRadius: radius.lg,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: { color: "#FFF", fontSize: 17, fontWeight: "700", marginLeft: 8 },
  gpsHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  gpsHintText: { fontSize: 12, color: colors.textSecondary },
});

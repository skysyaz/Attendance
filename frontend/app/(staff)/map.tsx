import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { api } from "../../src/api";
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
};

function buildMapHtml(records: Record[]): string {
  const points: any[] = [];
  records.forEach((r) => {
    points.push({
      lat: r.check_in_lat,
      lng: r.check_in_lng,
      type: "in",
      label: `Check-in: ${format(new Date(r.check_in_time), "MMM d, HH:mm")}`,
    });
    if (r.check_out_lat != null && r.check_out_lng != null && r.check_out_time) {
      points.push({
        lat: r.check_out_lat,
        lng: r.check_out_lng,
        type: "out",
        label: `Check-out: ${format(new Date(r.check_out_time), "MMM d, HH:mm")}`,
      });
    }
  });
  const center = points.length > 0 ? [points[0].lat, points[0].lng] : [20, 0];
  const zoom = points.length > 0 ? 11 : 2;

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#fff;font-family:-apple-system,sans-serif}
.leaflet-container{background:#f3f4f6}
.pin{width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.pin.in{background:#10B981}.pin.out{background:#EF4444}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map').setView([${center[0]}, ${center[1]}], ${zoom});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution:''}).addTo(map);
var pts = ${JSON.stringify(points)};
var group = L.featureGroup();
pts.forEach(function(p){
  var icon = L.divIcon({className:'', html:'<div class="pin '+p.type+'"></div>', iconSize:[24,24], iconAnchor:[12,12]});
  var m = L.marker([p.lat,p.lng],{icon:icon}).bindPopup(p.label);
  group.addLayer(m);
});
group.addTo(map);
if(pts.length>0){ try{ map.fitBounds(group.getBounds().pad(0.3)); }catch(e){} }
</script></body></html>`;
}

export default function MapScreen() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/attendance/me");
        setRecords(data);
      } finally {
        setLoading(false);
      }
    })();
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

  const html = buildMapHtml(records);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>MAP</Text>
        <Text style={styles.h1}>Check-in locations</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Check-in</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>Check-out</Text>
        </View>
        <Text style={styles.count}>{records.length} days</Text>
      </View>

      <View style={styles.mapWrap} testID="map-view">
        {Platform.OS === "web" ? (
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }}
          />
        ) : (
          <WebView
            originWhitelist={["*"]}
            source={{ html }}
            style={{ flex: 1, borderRadius: 8 }}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  brand: { fontSize: 11, letterSpacing: 3, color: colors.brand, fontWeight: "700", marginBottom: 8 },
  h1: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  legend: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: spacing.md },
  legendText: { fontSize: 12, color: colors.textSecondary, marginLeft: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  count: { marginLeft: "auto", fontSize: 11, letterSpacing: 1, color: colors.textSecondary, fontWeight: "600" },
  mapWrap: {
    flex: 1,
    margin: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: "hidden",
  },
});

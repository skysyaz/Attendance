import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { api, formatApiError } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";

type Office = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export default function Offices() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/offices");
      setOffices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [locating, setLocating] = useState(false);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLat(loc.coords.latitude.toFixed(6));
      setLng(loc.coords.longitude.toFixed(6));

      // Reverse geocode to auto-fill address (and name if empty)
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (places && places.length > 0) {
          const p = places[0];
          const addr = [p.name, p.street, p.city, p.region, p.postalCode, p.country]
            .filter(Boolean)
            .join(", ");
          if (addr) setAddress(addr);
          if (!name) {
            const suggested = p.name || p.city || p.district || "New office";
            setName(suggested);
          }
        }
      } catch {
        // Reverse geocoding failed silently; coords still set
      }
    } catch (e: any) {
      Alert.alert("Location error", e?.message || "Unable to fetch location");
    } finally {
      setLocating(false);
    }
  };

  const submitOffice = async () => {
    if (!name || !address || !lat || !lng) {
      Alert.alert("Missing fields", "Please fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      if (editingOffice) {
        await api.put(`/offices/${editingOffice.id}`, {
          name,
          address,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        });
        setEditingOffice(null);
      } else {
        await api.post("/offices", {
          name,
          address,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        });
      }
      setName("");
      setAddress("");
      setLat("");
      setLng("");
      await load();
    } catch (e) {
      Alert.alert("Error", formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteOffice = (id: string) => {
    Alert.alert("Delete office", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/offices/${id}`);
            await load();
          } catch (e) {
            Alert.alert("Error", formatApiError(e));
          }
        },
      },
    ]);
  };

  const editOffice = (office: Office) => {
    setEditingOffice(office);
    setName(office.name);
    setAddress(office.address);
    setLat(String(office.latitude));
    setLng(String(office.longitude));
  };

  const cancelEdit = () => {
    setEditingOffice(null);
    setName("");
    setAddress("");
    setLat("");
    setLng("");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>OFFICES</Text>
          <Text style={styles.h1}>Manage locations</Text>

          <View style={styles.form}>
            <Text style={styles.sectionLabel}>{editingOffice ? "EDIT OFFICE" : "ADD NEW OFFICE"}</Text>

            <TextInput
              testID="office-name-input"
              placeholder="Office name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              testID="office-address-input"
              placeholder="Street address"
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={setAddress}
              style={[styles.input, { marginTop: spacing.sm }]}
            />
            <View style={styles.latLngRow}>
              <TextInput
                testID="office-lat-input"
                placeholder="Latitude"
                placeholderTextColor={colors.textSecondary}
                value={lat}
                onChangeText={setLat}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                testID="office-lng-input"
                placeholder="Longitude"
                placeholderTextColor={colors.textSecondary}
                value={lng}
                onChangeText={setLng}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, marginLeft: spacing.sm }]}
              />
            </View>

            <TouchableOpacity
              testID="use-current-location"
              onPress={useCurrentLocation}
              disabled={locating}
              style={[styles.linkRow, locating && { opacity: 0.6 }]}
            >
              <Feather name="crosshair" size={14} color={colors.brand} />
              <Text style={styles.linkRowText}>
                {locating ? "Detecting location…" : "Use current location (auto-detects address)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="submit-office-button"
              onPress={submitOffice}
              disabled={submitting}
              style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? (editingOffice ? "Updating..." : "Adding...") : (editingOffice ? "Update office" : "Add office")}
              </Text>
            </TouchableOpacity>

            {editingOffice && (
              <TouchableOpacity
                testID="cancel-edit-button"
                onPress={cancelEdit}
                style={[styles.secondaryBtn]}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.listHead}>
            <Text style={styles.sectionLabel}>ALL OFFICES</Text>
            <Text style={styles.sectionCount}>{offices.length}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.brand} />
          ) : offices.length === 0 ? (
            <Text style={styles.empty}>No offices yet</Text>
          ) : (
            offices.map((o) => (
              <View key={o.id} style={styles.officeCard} testID={`office-card-${o.id}`}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.officeName}>{o.name}</Text>
                  <Text style={styles.officeAddr}>{o.address}</Text>
                  <Text style={styles.officeCoord}>
                    {o.latitude.toFixed(5)}, {o.longitude.toFixed(5)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => editOffice(o)}
                  style={styles.editBtn}
                  testID={`edit-office-${o.id}`}
                >
                  <Feather name="edit-2" size={18} color={colors.brand} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteOffice(o.id)}
                  style={styles.deleteBtn}
                  testID={`delete-office-${o.id}`}
                >
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  brand: { fontSize: 11, letterSpacing: 3, color: colors.brand, fontWeight: "700", marginBottom: 8 },
  h1: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  form: { marginTop: spacing.lg },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  latLngRow: { flexDirection: "row", marginTop: spacing.sm },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  linkRowText: { color: colors.brand, fontSize: 13, fontWeight: "600", marginLeft: 6 },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  listHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  sectionCount: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  empty: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.md },
  officeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  officeName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  officeAddr: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  officeCoord: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  deleteBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  editBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginRight: 2,
  },
  secondaryBtn: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
});

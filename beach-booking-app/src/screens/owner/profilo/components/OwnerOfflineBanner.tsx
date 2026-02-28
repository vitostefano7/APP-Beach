import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function OwnerOfflineBanner() {
  return (
    <View style={styles.offlineBanner}>
      <Ionicons name="wifi-outline" size={16} color="white" />
      <Text style={styles.offlineBannerText}>Sei offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineBannerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

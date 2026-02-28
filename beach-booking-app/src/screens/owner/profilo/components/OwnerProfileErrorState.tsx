import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface OwnerProfileErrorStateProps {
  error: string;
  isOffline: boolean;
  onRetry: () => void;
}

export function OwnerProfileErrorState({ error, isOffline, onRetry }: OwnerProfileErrorStateProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle" size={64} color="#E53935" />
        </View>
        <Text style={styles.errorTitle}>{error}</Text>

        {isOffline && <Text style={styles.offlineText}>⚠️ Sei offline</Text>}

        <Pressable
          style={[styles.retryButton, isOffline && styles.disabledButton]}
          onPress={onRetry}
          disabled={isOffline}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryText}>Riprova</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E53935",
    marginBottom: 24,
    textAlign: "center",
  },
  offlineText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  retryText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OwnerProfileHeaderProps {
  shouldShowAvatar: boolean;
  avatarRefreshKey: number;
  finalAvatarUrl: string | null;
  uploading: boolean;
  fullName: string;
  onOpenSettings: () => void;
  onChangeAvatar: () => void;
  onAvatarError: () => void;
}

export function OwnerProfileHeader({
  shouldShowAvatar,
  avatarRefreshKey,
  finalAvatarUrl,
  uploading,
  fullName,
  onOpenSettings,
  onChangeAvatar,
  onAvatarError,
}: OwnerProfileHeaderProps) {
  return (
    <View style={styles.blueHeader}>
      <View style={styles.headerTopRow}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Profilo Owner</Text>
        <Pressable style={styles.settingsButton} onPress={onOpenSettings}>
          <Ionicons name="settings-outline" size={22} color="white" />
        </Pressable>
      </View>

      <Pressable
        style={styles.avatarContainer}
        onPress={onChangeAvatar}
        accessibilityLabel="Cambia immagine profilo"
        accessibilityRole="button"
        disabled={uploading}
      >
        {shouldShowAvatar ? (
          <Image
            key={avatarRefreshKey}
            source={{ uri: finalAvatarUrl || undefined }}
            style={[styles.largeAvatar, uploading && styles.uploadingAvatar]}
            onError={onAvatarError}
          />
        ) : (
          <View style={[styles.largeAvatarPlaceholder, uploading && styles.uploadingAvatar]}>
            <Ionicons name="business" size={50} color="white" />
          </View>
        )}
      </Pressable>

      <Text style={styles.ownerName}>{fullName || "Caricamento..."}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  blueHeader: {
    backgroundColor: "#2979c1",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1e5a8e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  largeAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  largeAvatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#1e5a8e",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingAvatar: {
    opacity: 0.7,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
});

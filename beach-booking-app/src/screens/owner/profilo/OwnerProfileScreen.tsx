import { ScrollView, Pressable, Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAlert } from "../../../context/AlertContext";
import { AvatarPicker } from "../../../components/AvatarPicker";
import { resolveAvatarUrl } from "../../../utils/avatar";
import { useOwnerStats } from "../../../hooks/useOwnerStats";
import { OwnerOfflineBanner } from "./components/OwnerOfflineBanner";
import { OwnerProfileSkeleton } from "./components/OwnerProfileSkeleton";
import { OwnerProfileErrorState } from "./components/OwnerProfileErrorState";
import { OwnerProfileHeader } from "./components/OwnerProfileHeader";
import { OwnerProfileActionCards } from "./components/OwnerProfileActionCards";
import { OwnerProfileStatsSection } from "./components/OwnerProfileStatsSection";
import { useOwnerProfile } from "./hooks/useOwnerProfile";
import { useAvatarManager } from "./hooks/useAvatarManager";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { User } from "./types";

export default function OwnerProfileScreen() {
  const { token, logout, user, updateUser } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();

  const {
    strutture,
    bookings,
    campi,
    loading,
    statsLoading,
    error,
    fetchProfile,
    hydrateFromCache,
  } = useOwnerProfile(token);
  const stats = useOwnerStats(bookings, strutture, campi);

  const {
    avatarUrl,
    avatarError,
    avatarRefreshKey,
    uploading,
    uploadAvatar,
    removeAvatar,
    handleAvatarError,
  } = useAvatarManager({
    token,
    user: user as User | null,
    updateUser: updateUser as ((updatedUser: Partial<User>) => void) | null,
    showAlert,
    fetchProfile,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const isOffline = useNetworkStatus();

  const fetchAndSyncProfile = useCallback(async (options?: { skipLoading?: boolean }) => {
    const fetchedUser = await fetchProfile(options);
    if (fetchedUser) {
      setProfileUser(fetchedUser);
    }
  }, [fetchProfile]);

  const bootstrapProfile = useCallback(async () => {
    try {
      const cachedUser = await hydrateFromCache();
      if (cachedUser) {
        setProfileUser(cachedUser);
      }

      await fetchAndSyncProfile({ skipLoading: !!cachedUser });
    } catch (err) {
      console.error("Errore bootstrap profilo owner:", err);
    }
  }, [fetchAndSyncProfile, hydrateFromCache]);

  useEffect(() => {
    bootstrapProfile();
  }, [bootstrapProfile]);

  const onRefresh = useCallback(async () => {
    if (isOffline) {
      Alert.alert("Offline", "Non sei connesso a Internet");
      return;
    }

    setRefreshing(true);
    try {
      await fetchAndSyncProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAndSyncProfile, isOffline]);

  const changeAvatar = useCallback(() => {
    if (uploading) {
      return;
    }
    setShowAvatarPicker(true);
  }, [uploading]);

  const pickImageFromGallery = useCallback(async () => {
    if (uploading) {
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showAlert({
          type: "warning",
          title: "Permesso necessario",
          message: "Devi concedere il permesso per accedere alle tue foto",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore selezione immagine:", error);
      showAlert({
        type: "error",
        title: "Errore",
        message: "Impossibile selezionare l'immagine",
        buttons: [{ text: "OK", style: "default" }],
      });
    }
  }, [uploadAvatar, uploading, showAlert]);

  const takePhotoWithCamera = useCallback(async () => {
    if (uploading) {
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        showAlert({
          type: "warning",
          title: "Permesso necessario",
          message: "Devi concedere il permesso per usare la fotocamera",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore fotocamera:", error);
      showAlert({
        type: "error",
        title: "Errore",
        message: "Impossibile scattare la foto",
        buttons: [{ text: "OK", style: "default" }],
      });
    }
  }, [uploadAvatar, uploading, showAlert]);

  if (loading && !refreshing) {
    return <OwnerProfileSkeleton />;
  }

  if (error && !refreshing) {
    return <OwnerProfileErrorState error={error} isOffline={isOffline} onRetry={fetchAndSyncProfile} />;
  }

  const finalAvatarUrl = resolveAvatarUrl(avatarError ? null : avatarUrl);
  const shouldShowAvatar = finalAvatarUrl && !avatarError;
  const fullName = [profileUser?.name || user?.name, profileUser?.surname || user?.surname]
    .filter(Boolean)
    .join(" ");

  return (
    <SafeAreaView style={styles.safe}>
      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelectGallery={pickImageFromGallery}
        onSelectCamera={takePhotoWithCamera}
        onRemovePhoto={removeAvatar}
        hasPhoto={!!avatarUrl && !avatarError}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            {...({
              refreshing,
              onRefresh,
              colors: ["#2196F3"],
              tintColor: "#2196F3",
              enabled: !isOffline,
            } as any)}
          />
        }
      >
        {isOffline && <OwnerOfflineBanner />}

        <OwnerProfileHeader
          shouldShowAvatar={!!shouldShowAvatar}
          avatarRefreshKey={avatarRefreshKey}
          finalAvatarUrl={finalAvatarUrl}
          uploading={uploading}
          fullName={fullName}
          onOpenSettings={() => navigation.navigate("Settings")}
          onChangeAvatar={changeAvatar}
          onAvatarError={handleAvatarError}
        />

        <OwnerProfileActionCards
          struttureCount={stats.strutture}
          prenotazioniCount={stats.prenotazioni}
          onOpenStrutture={() => navigation.navigate("Strutture")}
          onOpenBookings={() => navigation.navigate("OwnerBookings")}
        />

        <OwnerProfileStatsSection
          stats={stats}
          businessStatsLoading={statsLoading}
          onOpenEarnings={(totalEarnings: number) =>
            navigation.navigate("EarningsStats", { earnings: { totalEarnings, earnings: [] } })
          }
          onOpenBusinessStats={() => navigation.navigate("OwnerStatistics")}
        />

        <Pressable
          style={styles.logoutButton}
          onPress={logout}
          accessibilityLabel="Esci dall'account"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFEBEE",
    borderWidth: 1.5,
    borderColor: "#E53935",
  },
  logoutText: {
    color: "#E53935",
    fontWeight: "800",
    fontSize: 16,
  },
  bottomSpacer: {
    height: 20,
  },
});

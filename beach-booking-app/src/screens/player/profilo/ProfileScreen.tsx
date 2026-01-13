import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";

import { AuthContext } from "../../../context/AuthContext";
import { useUnreadMessages } from "../../../context/UnreadMessagesContext";
import { ProfileStackParamList } from "../../../navigation/ProfilePlayerStack";
import { styles } from "../styles-player/ProfileScreen.styles";
import API_URL from "../../../config/api";
import { resolveAvatarUrl } from "../../../utils/avatar";
import { Avatar } from "../../../components/Avatar";
import { useCustomAlert } from "../../../components/CustomAlert";
import { AvatarPicker } from "../../../components/AvatarPicker";

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

type ProfileResponse = {
  profile: {
    matchesPlayed: number;
    ratingAverage: number;
    favoriteCampo: { name: string } | null;
    friendsCount: number;
    followersCount: number;
    followingCount: number;
  };
  preferences: {
    pushNotifications: boolean;
    darkMode: boolean;
  };
  payments: Array<{
    last4: string;
    expMonth: number;
    expYear: number;
  }>;
};

export default function ProfileScreen() {
  const { token, logout, user, updateUser } = useContext(AuthContext);
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();
  const navigation = useNavigation<ProfileNavigationProp>();
  const { showAlert, AlertComponent } = useCustomAlert();

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // ✅ Sincronizza avatarUrl quando user cambia nel context
  useEffect(() => {
    console.log("👤 User context aggiornato, dati completi:", user);
    if (user.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user.avatarUrl]);

  useEffect(() => {
    if (token) {
      refreshUnreadCount();
    }
  }, [token, refreshUnreadCount]);

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 ProfileScreen focused");
      if (token) {
        refreshUnreadCount();
        loadProfile();
      }
    }, [token])
  );

  const loadProfile = async () => {
    try {
      const [profileRes, friendsRes] = await Promise.all([
        fetch(`${API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/friends/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const json = await profileRes.json();
      let friendsCount = 0;
      let followersCount = 0;
      let followingCount = 0;
      if (friendsRes.ok) {
        const friendsJson = await friendsRes.json();
        friendsCount = friendsJson.friendCount ?? 0;
        followersCount = friendsJson.followersCount ?? 0;
        followingCount = friendsJson.followingCount ?? 0;
      } else {
        console.log("Errore caricamento friends stats:", friendsRes.status);
      }
      console.log("Dati profilo ricevuti:", json);
      console.log("avatarUrl dal backend:", json.user?.avatarUrl);

      const parsed: ProfileResponse = {
        profile: {
          matchesPlayed: json.profile?.matchesPlayed ?? 0,
          ratingAverage: json.profile?.ratingAverage ?? 0,
          favoriteCampo: json.profile?.favoriteCampo ?? null,
          friendsCount,
          followersCount,
          followingCount,
        },
        preferences: {
          pushNotifications: json.preferences?.pushNotifications ?? false,
          darkMode: json.preferences?.darkMode ?? false,
        },
        payments: json.payments ?? [],
      };

      setData(parsed);

      // ✅ Aggiorna avatar se presente
      if (json.user.avatarUrl) {
        console.log("✅ Setting avatarUrl:", json.user.avatarUrl);
        setAvatarUrl(json.user.avatarUrl);
      } else {
        console.log("⚠️ Nessun avatarUrl ricevuto dal backend");
      }

      // ✅ Aggiorna i dati base dell'utente nel context se necessario
      if (json.user && updateUser) {
        const userDataToUpdate: any = {};
        if (json.user.name && json.user.name !== user.name) userDataToUpdate.name = json.user.name;
        if (json.user.surname && json.user.surname !== user.surname) userDataToUpdate.surname = json.user.surname;
        if (json.user.username && json.user.username !== user.username) userDataToUpdate.username = json.user.username;
        if (json.user.email && json.user.email !== user.email) userDataToUpdate.email = json.user.email;
        if (json.user.avatarUrl && json.user.avatarUrl !== user.avatarUrl) userDataToUpdate.avatarUrl = json.user.avatarUrl;
        if (json.user.profilePrivacy && json.user.profilePrivacy !== user.profilePrivacy) userDataToUpdate.profilePrivacy = json.user.profilePrivacy;

        if (Object.keys(userDataToUpdate).length > 0) {
          console.log("🔄 Aggiornando dati utente nel context:", userDataToUpdate);
          updateUser(userDataToUpdate);
        }
      }
    } catch (e) {
      console.error("Errore caricamento profilo", e);
    }
  };

  // ✅ Funzione per cambiare avatar
  const changeAvatar = () => {
    setShowAvatarPicker(true);
  };

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showAlert({
          type: 'warning',
          title: 'Permesso necessario',
          message: 'Devi concedere il permesso per accedere alle tue foto',
          buttons: [{ text: 'OK', style: 'default' }],
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
        type: 'error',
        title: 'Errore',
        message: 'Impossibile selezionare l\'immagine',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        showAlert({
          type: 'warning',
          title: 'Permesso necessario',
          message: 'Devi concedere il permesso per usare la fotocamera',
          buttons: [{ text: 'OK', style: 'default' }],
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
        type: 'error',
        title: 'Errore',
        message: 'Impossibile scattare la foto',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      console.log("[uploadAvatar] start", {
        imageUri,
        apiUrl: API_URL,
        hasToken: !!token,
      });

      const formData = new FormData();

      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      console.log("[uploadAvatar] file", { filename, type });

      formData.append("avatar", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const endpoint = `${API_URL}/users/me/avatar`;
      console.log("[uploadAvatar] POST", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("[uploadAvatar] response", {
        status: res.status,
        ok: res.ok,
      });

      const json = await res.json();

      if (res.ok) {
        console.log("Avatar caricato:", json.avatarUrl);
        console.log("API_URL:", API_URL);
        console.log("URL completo:", resolveAvatarUrl(json.avatarUrl));

        // ✅ Aggiorna lo stato locale con un nuovo timestamp per forzare il refresh
        setAvatarUrl(json.avatarUrl);
        setAvatarRefreshKey(prev => prev + 1);

        // ✅ Aggiorna il contesto user
        if (updateUser) {
          updateUser({ ...user, avatarUrl: json.avatarUrl });
        }

        // ✅ Ricarica il profilo per assicurarsi che tutto sia sincronizzato
        await loadProfile();

        showAlert({
          type: 'success',
          title: 'Perfetto!',
          message: 'La tua immagine profilo è stata aggiornata con successo',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        console.log("❌ Errore upload:", json.message);
        showAlert({
          type: 'error',
          title: 'Ops!',
          message: json.message || 'Non siamo riusciti a caricare l\'immagine. Riprova.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      console.log("[uploadAvatar] network error context", {
        apiUrl: API_URL,
        hasToken: !!token,
        imageUri,
      });
      showAlert({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Verifica la tua connessione internet e riprova',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const removeAvatar = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setAvatarUrl(null);
        setAvatarRefreshKey(prev => prev + 1);

        // ✅ Aggiorna il contesto user
        if (updateUser) {
          updateUser({ ...user, avatarUrl: null });
        }

        // ✅ Ricarica il profilo
        await loadProfile();

        showAlert({
          type: 'success',
          title: 'Fatto!',
          message: 'La tua immagine profilo è stata rimossa',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Ops!',
          message: 'Non siamo riusciti a rimuovere l\'immagine',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error("Remove avatar error:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Non siamo riusciti a rimuovere l\'immagine',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleLogout = () => {
    Alert.alert("Conferma uscita", "Vuoi uscire dal tuo account", [
      { text: "Annulla", style: "cancel" },
      { text: "Esci", style: "destructive", onPress: logout },
    ]);
  };


  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Ionicons name="person-circle-outline" size={64} color="#ccc" />
          <Text style={styles.loadingText}>Caricamento profilo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { profile } = data;

  return (
    <SafeAreaView style={styles.safe}>
      <AlertComponent />

      {/* Header con bottone impostazioni */}
      <View style={styles.header}>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons name="settings-outline" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {user.name}{user.surname ? ` ${user.surname}` : ''}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelectGallery={pickImageFromGallery}
        onSelectCamera={takePhotoWithCamera}
        onRemovePhoto={removeAvatar}
        hasPhoto={!!avatarUrl}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {/* Layout stile Instagram */}
          <View style={styles.instagramHeader}>
            {/* Avatar a sinistra */}
            <View style={styles.avatarContainer}>
              <Avatar
                key={`avatar-${avatarRefreshKey}`}
                name={user.name}
                surname={user.surname}
                avatarUrl={avatarUrl}
                size="large"
                onPress={changeAvatar}
              />

              {user.profilePrivacy === 'private' && (
                <View style={styles.privateBadge}>
                  <Ionicons name="lock-closed" size={14} color="#666" />
                </View>
              )}

              <Pressable style={styles.editAvatarButton} onPress={changeAvatar}>
                <Ionicons name="camera" size={14} color="white" />
              </Pressable>
            </View>

            {/* Stats in orizzontale stile Instagram */}
            <View style={styles.instagramStats}>
              <Pressable
                style={({ pressed }) => [
                  styles.instagramStatItem,
                  pressed && styles.instagramStatItemPressed
                ]}
                onPress={() => navigation.navigate("Conversazione")}
              >
                <View style={styles.statWithIcon}>
                  <Ionicons 
                    name="chatbubble-ellipses" 
                    size={16} 
                    color={unreadCount > 0 ? "#FF5252" : "#666"} 
                  />
                  {unreadCount > 0 && (
                    <View style={styles.unreadIndicator}>
                      <Text style={styles.unreadIndicatorText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.instagramStatValue, unreadCount > 0 && styles.statValueUnread]}>
                  {unreadCount}
                </Text>
                <Text style={styles.instagramStatLabel}>messaggi</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.instagramStatItem,
                  pressed && styles.instagramStatItemPressed
                ]}
                onPress={() => navigation.navigate("FriendsList", { filter: "followers" })}
              >
                <View style={styles.statWithIcon}>
                  <Ionicons name="people" size={16} color="#666" />
                </View>
                <Text style={styles.instagramStatValue}>{profile.followersCount ?? 0}</Text>
                <Text style={styles.instagramStatLabel}>follower</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.instagramStatItem,
                  pressed && styles.instagramStatItemPressed
                ]}
                onPress={() => navigation.navigate("FriendsList", { filter: "following" })}
              >
                <View style={styles.statWithIcon}>
                  <Ionicons name="person-add" size={16} color="#666" />
                </View>
                <Text style={styles.instagramStatValue}>{profile.followingCount ?? 0}</Text>
                <Text style={styles.instagramStatLabel}>seguiti</Text>
              </Pressable>
            </View>
          </View>

          {/* Nome e bio sotto */}
          <View style={styles.instagramBio}>
            {user.username && (
              <Text style={styles.instagramUsername}>@{user.username}</Text>
            )}
          </View>
        </View>

        {profile.favoriteCampo && (
          <View style={styles.favorite}>
            <View style={styles.favoriteHeader}>
              <Ionicons name="heart" size={20} color="#F44336" />
              <Text style={styles.favoriteTitle}>Campo preferito</Text>
            </View>
            <Text style={styles.favoriteName}>{profile.favoriteCampo.name}</Text>
          </View>
        )}

        <Pressable style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </Pressable>

        <Text style={styles.version}>Versione 2.4.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}



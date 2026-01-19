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
import { LinearGradient } from "expo-linear-gradient";

import { AuthContext } from "../../../context/AuthContext";
import { useUnreadMessages } from "../../../context/UnreadMessagesContext";
import { ProfileStackParamList } from "../../../navigation/ProfilePlayerStack";
import { styles } from "../styles-player/ProfileScreen.styles";
import API_URL from "../../../config/api";
import { resolveAvatarUrl } from "../../../utils/avatar";
import { Avatar } from "../../../components/Avatar/Avatar";
import { useCustomAlert } from "../../../components/CustomAlert";
import { AvatarPicker } from "../../../components/AvatarPicker";
import { StatsCarousel } from "./components/StatsCarousel";

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

  // Stati per le statistiche
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [socialStats, setSocialStats] = useState<any>(null);
  const [venuesStats, setVenuesStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
        loadStats();
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

  const loadStats = async () => {
    try {
      setStatsLoading(true);

      // Chiamate parallele per performance, social e venues
      const [performanceRes, playedWithRes, venuesRes] = await Promise.all([
        fetch(`${API_URL}/users/me/performance-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/me/played-with`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/me/frequented-venues`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let perfData = null;

      // Performance stats
      if (performanceRes.ok) {
        perfData = await performanceRes.json();
        setPerformanceStats(perfData);
      }

      // Social stats (played with)
      if (playedWithRes.ok) {
        const socialData = await playedWithRes.json();
        setSocialStats({
          totalPeopleMet: socialData.playedWith?.length || 0,
          topPlayers: socialData.playedWith || [],
        });
      }

      // Venues stats
      if (venuesRes.ok) {
        const venuesData = await venuesRes.json();
        setVenuesStats({
          totalVenues: venuesData.venues?.length || 0,
          topVenues: venuesData.venues || [],
          lastMatch: perfData?.lastMatch,
          preferredDay: perfData?.preferredDay,
          matchesThisMonth: perfData?.matchesThisMonth,
        });
      }
    } catch (e) {
      console.error("Errore caricamento statistiche", e);
    } finally {
      setStatsLoading(false);
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

      {/* Header con gradiente */}
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>
            Il tuo profilo
          </Text>
          <Pressable
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelectGallery={pickImageFromGallery}
        onSelectCamera={takePhotoWithCamera}
        onRemovePhoto={removeAvatar}
        hasPhoto={!!avatarUrl}
      />
      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section con Avatar e Info */}
        <LinearGradient
          colors={['#2563EB', '#3B82F6']}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            {/* Avatar Centrale */}
            <View style={styles.avatarWrapper}>
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

                <Pressable style={[styles.editAvatarButton, { backgroundColor: '#3B82F6', shadowColor: '#3B82F6' }]} onPress={changeAvatar}>
                  <Ionicons name="camera" size={14} color="white" />
                </Pressable>
              </View>
            </View>

            {/* Nome e Username */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.name}{user.surname ? ` ${user.surname}` : ''}
              </Text>
              {user.username && (
                <Text style={styles.userUsername}>@{user.username}</Text>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.statCardPressed
            ]}
            onPress={() => navigation.navigate("Conversazione")}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#2196F3" />
              {unreadCount > 0 && (
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.statValue}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Messaggi</Text>
            <Text style={styles.statLabel}>da leggere</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.statCardPressed
            ]}
            onPress={() => navigation.navigate("FriendsList", { filter: "followers" })}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="people" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.statValue}>{profile.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Follower</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.statCardPressed
            ]}
            onPress={() => navigation.navigate("FriendsList", { filter: "following" })}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="person-add" size={20} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{profile.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Seguiti</Text>
          </Pressable>
        </View>

        {profile.favoriteCampo && (
          <LinearGradient
            colors={['#FF6B6B', '#EE5A6F']}
            style={styles.favoriteGradient}
          >
            <View style={styles.favoriteContent}>
              <View style={styles.favoriteIconBox}>
                <Ionicons name="heart" size={22} color="#fff" />
              </View>
              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteLabel}>Campo del cuore</Text>
                <Text style={styles.favoriteName}>{profile.favoriteCampo.name}</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Performance Card */}
        {statsLoading ? (
          <View style={{ marginHorizontal: 16, marginTop: 20, marginBottom: 20, alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="stats-chart" size={48} color="#3B82F6" />
            <Text style={{ marginTop: 12, fontSize: 14, color: '#666' }}>Caricamento statistiche...</Text>
          </View>
        ) : performanceStats ? (
          <View style={{ marginHorizontal: 16, marginTop: 20, marginBottom: 20 }}>
            <LinearGradient
              colors={['#2563EB', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 20,
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name="trophy" size={28} color="#fff" />
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginLeft: 10 }}>
                  Performance
                </Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                }}>
                  <Ionicons name="tennisball" size={24} color="#fff" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff' }}>
                    {performanceStats.matchesPlayed || 0}
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                    Partite
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                }}>
                  <Ionicons name="trophy" size={24} color="#4ADE80" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 32, fontWeight: '700', color: '#4ADE80' }}>
                    {performanceStats.wins || 0}
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                    Vittorie
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                }}>
                  <Ionicons name="trending-down" size={24} color="#fff" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff' }}>
                    {performanceStats.losses || 0}
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                    Sconfitte
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                }}>
                  <Ionicons name="stats-chart" size={24} color="#FCD34D" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 32, fontWeight: '700', color: '#FCD34D' }}>
                    {performanceStats.winRate || 0}%
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                    Win Rate
                  </Text>
                </View>
              </View>

              
            </LinearGradient>
          </View>
        ) : null}

        {/* Match History */}
        {performanceStats?.recentMatches && performanceStats.recentMatches.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              {performanceStats.recentMatches.slice(0, 5).map((match: any, index: number) => (
                <View 
                  key={index}
                  style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: match.won ? '#22C55E' : '#EF4444',
                    justifyContent: 'center', 
                    alignItems: 'center' 
                  }}
                >
                  <Ionicons 
                    name={match.won ? "checkmark" : "close"} 
                    size={28} 
                    color="#fff" 
                  />
                </View>
              ))}
              {performanceStats.recentMatches.length < 5 && (
                Array.from({ length: 5 - performanceStats.recentMatches.length }).map((_, index) => (
                  <View 
                    key={`empty-${index}`}
                    style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: 25, 
                      backgroundColor: '#E5E7EB',
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={28} color="#9CA3AF" />
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <Pressable 
          style={({ pressed }) => [
            styles.logout,
            pressed && styles.logoutPressed
          ]} 
          onPress={handleLogout}
        >
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
          </View>
          <View style={styles.logoutContent}>
            <Text style={styles.logoutText}>Esci dall'account</Text>
            <Text style={styles.logoutSubtext}>Disconnetti il tuo profilo</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </Pressable>

        <View style={styles.versionContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#999" />
          <Text style={styles.version}>Versione 2.4.0</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}



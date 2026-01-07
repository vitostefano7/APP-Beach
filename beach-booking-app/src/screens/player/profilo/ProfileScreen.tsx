import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback, ElementType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";

import { AuthContext } from "../../../context/AuthContext";
import { useUnreadMessages } from "../../../context/UnreadMessagesContext";
import { ProfileStackParamList } from "../../../navigation/ProfilePlayerStack";
import { styles } from "../styles-player/ProfileScreen.styles";
import API_URL from "../../../config/api";

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

type ProfileResponse = {
  profile: {
    matchesPlayed: number;
    ratingAverage?: number;
    favoriteCampo?: { name: string } | null;
    friendsCount?: number;
    followersCount?: number;
    followingCount?: number;
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

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);

  // ✅ Sincronizza avatarUrl quando user cambia nel context
  useEffect(() => {
    console.log("👤 User context aggiornato, avatarUrl:", user?.avatarUrl);
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

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
      console.log("📥 Dati profilo ricevuti:", json);
      console.log("🖼️ avatarUrl dal backend:", json.user?.avatarUrl);

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
      setPushNotifications(parsed.preferences.pushNotifications);
      setDarkMode(parsed.preferences.darkMode);
      
      // ✅ Aggiorna avatar se presente
      if (json.user?.avatarUrl) {
        console.log("✅ Setting avatarUrl:", json.user.avatarUrl);
        setAvatarUrl(json.user.avatarUrl);
      } else {
        console.log("⚠️ Nessun avatarUrl ricevuto dal backend");
      }
    } catch (e) {
      console.error("Errore caricamento profilo", e);
    }
  };

  // ✅ Funzione per cambiare avatar
  const changeAvatar = () => {
    if (avatarUrl) {
      // Se c'è già un avatar, mostra anche "Rimuovi foto"
      Alert.alert(
        "Cambia immagine profilo",
        "Come vuoi caricare la tua foto?",
        [
          { text: "Annulla", onPress: () => {}, style: "cancel" as const },
          { text: "Galleria", onPress: pickImageFromGallery },
          { text: "Fotocamera", onPress: takePhotoWithCamera },
          { 
            text: "Rimuovi foto", 
            onPress: removeAvatar,
            style: "destructive" as const
          },
        ],
        { cancelable: true }
      );
    } else {
      // Se non c'è avatar, solo galleria e fotocamera
      Alert.alert(
        "Cambia immagine profilo",
        "Come vuoi caricare la tua foto?",
        [
          { text: "Annulla", onPress: () => {}, style: "cancel" as const },
          { text: "Galleria", onPress: pickImageFromGallery },
          { text: "Fotocamera", onPress: takePhotoWithCamera },
        ],
        { cancelable: true }
      );
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permesso negato",
          "Devi concedere il permesso per accedere alle foto"
        );
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
      Alert.alert("Errore", "Impossibile selezionare l'immagine");
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permesso negato",
          "Devi concedere il permesso per usare la fotocamera"
        );
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
      Alert.alert("Errore", "Impossibile scattare la foto");
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      const formData = new FormData();
      
      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("avatar", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        console.log("✅ Avatar caricato:", json.avatarUrl);
        console.log("📍 API_URL:", API_URL);
        console.log("🖼️ URL completo:", `${API_URL}${json.avatarUrl}`);
        
        setAvatarUrl(json.avatarUrl);
        
        // ✅ Aggiorna il contesto user
        if (updateUser) {
          updateUser({ ...user, avatarUrl: json.avatarUrl });
        }
        
        Alert.alert("Successo", "Immagine profilo aggiornata!");
      } else {
        console.log("❌ Errore upload:", json.message);
        Alert.alert("Errore", json.message || "Impossibile caricare l'immagine");
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      Alert.alert("Errore", "Impossibile caricare l'immagine");
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
        
        // ✅ Aggiorna il contesto user
        if (updateUser) {
          updateUser({ ...user, avatarUrl: null });
        }
        
        Alert.alert("Successo", "Immagine profilo rimossa!");
      } else {
        Alert.alert("Errore", "Impossibile rimuovere l'immagine");
      }
    } catch (error) {
      console.error("Remove avatar error:", error);
      Alert.alert("Errore", "Impossibile rimuovere l'immagine");
    }
  };

  const handleLogout = () => {
    Alert.alert("Conferma uscita", "Vuoi uscire dal tuo account?", [
      { text: "Annulla", style: "cancel" },
      { text: "Esci", style: "destructive", onPress: logout },
    ]);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarContainer}>
            {/* ✅ AVATAR con immagine o iniziali */}
            <Pressable style={styles.avatar} onPress={changeAvatar}>
              {avatarUrl ? (
                <>
                  <Image 
                    source={{ 
                      uri: `${API_URL}${avatarUrl}?t=${Date.now()}` 
                    }} 
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.log("❌ Errore caricamento immagine:");
                      console.log("   - avatarUrl:", avatarUrl);
                      console.log("   - API_URL:", API_URL);
                      console.log("   - URI completo:", `${API_URL}${avatarUrl}`);
                      console.log("   - Error:", error.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log("✅ Immagine caricata con successo!");
                      console.log("   - URI:", `${API_URL}${avatarUrl}`);
                    }}
                  />
                </>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                </View>
              )}
            </Pressable>
            
            {/* ✅ Badge lucchetto se profilo privato */}
            {user?.profilePrivacy === 'private' && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={16} color="#666" />
              </View>
            )}
            
            {/* ✅ Bottone camera per cambiare foto */}
            <Pressable style={styles.editAvatarButton} onPress={changeAvatar}>
              <Ionicons name="camera" size={16} color="white" />
            </Pressable>
          </View>
          
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.memberBadge}>
            <Ionicons name="calendar-outline" size={14} color="#2196F3" />
            <Text style={styles.memberText}>
              Membro dal {new Date(user.createdAt).getFullYear()}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: "#4CAF5020" }]}>
              <Ionicons name="people" size={24} color="#4CAF50" />
            </View>
            <View style={styles.dualStatRow}>
              <Pressable
                style={styles.dualStatCell}
                onPress={() => navigation.navigate("FriendsList", { filter: "followers" })}
              >
                <Text style={styles.statValue}>{profile.followersCount ?? 0}</Text>
                <Text style={styles.statLabel}>Follower</Text>
              </Pressable>
              <View style={styles.dualStatDivider} />
              <Pressable
                style={styles.dualStatCell}
                onPress={() => navigation.navigate("FriendsList", { filter: "following" })}
              >
                <Text style={styles.statValue}>{profile.followingCount ?? 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.statCard}
            onPress={() => navigation.navigate("Conversazione")}
          >
            <View style={[styles.statIconBox, { backgroundColor: "#4CAF5020" }]}>
              <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
              {unreadCount > 0 && (
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.statValue}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Chat & Messaggi</Text>
          </Pressable>
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

        <Text style={styles.sectionTitle}>Impostazioni</Text>
        <View style={styles.card}>
          <MenuItem 
            icon="settings-outline" 
            iconColor="#2196F3" 
            iconBg="#E3F2FD" 
            title="Preferenze" 
            subtitle="Location, sport preferiti, notifiche" 
            onPress={() => navigation.navigate("Preferences")} 
          />
          <Divider />
          <MenuItem 
            icon="lock-closed-outline" 
            iconColor="#9C27B0" 
            iconBg="#F3E5F5" 
            title="Privacy e sicurezza" 
            subtitle="Password, sicurezza account" 
            onPress={() => navigation.navigate("PrivacySecurity")} 
          />
        </View>

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

function StatCard({ 
  icon, 
  value, 
  label, 
  color,
  onPress,
}: { 
  icon: any; 
  value: number | string; 
  label: string; 
  color: string;
  onPress?: () => void;
}) {
  const Container: ElementType = onPress ? Pressable : View;
  const containerProps = onPress
    ? { onPress, accessibilityRole: "button" as const }
    : {};

  return (
    <Container style={styles.statCard} {...containerProps}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Container>
  );
}

function MenuItem({ 
  icon, 
  iconColor, 
  iconBg, 
  title, 
  subtitle, 
  onPress 
}: { 
  icon: any; 
  iconColor: string; 
  iconBg: string; 
  title: string; 
  subtitle: string; 
  onPress: () => void 
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </Pressable>
  );
}

function PreferenceRow({ 
  icon, 
  title, 
  subtitle, 
  value, 
  onChange, 
  disabled 
}: { 
  icon: any; 
  title: string; 
  subtitle: string; 
  value: boolean; 
  onChange: (v: boolean) => void; 
  disabled?: boolean 
}) {
  return (
    <View style={styles.prefRow}>
      <View style={[styles.prefIcon, { backgroundColor: "#E3F2FD" }]}>
        <Ionicons name={icon} size={20} color="#2196F3" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onChange} 
        disabled={disabled} 
        trackColor={{ false: "#e9ecef", true: "#2196F3" }} 
        thumbColor="white" 
      />
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

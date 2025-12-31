import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

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
  const { token, logout, user } = useContext(AuthContext);
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();
  const navigation = useNavigation<ProfileNavigationProp>();

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
      if (token) {
        refreshUnreadCount();
      }
    }, [token, refreshUnreadCount])
  );

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      const parsed: ProfileResponse = {
        profile: {
          matchesPlayed: json.profile?.matchesPlayed ?? 0,
          ratingAverage: json.profile?.ratingAverage ?? 0,
          favoriteCampo: json.profile?.favoriteCampo ?? null,
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
    } catch (e) {
      console.error("Errore caricamento profilo", e);
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <Pressable style={styles.editAvatarButton}>
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
          <StatCard 
            icon="trophy" 
            color="#FFC107" 
            value={profile.matchesPlayed} 
            label="Partite" 
          />
          
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
  color 
}: { 
  icon: any; 
  value: number | string; 
  label: string; 
  color: string 
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
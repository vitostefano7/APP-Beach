import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthContext } from "../context/AuthContext";
import { ProfileStackParamList } from "../navigation/ProfilePlayerStack";
import API_URL from "../config/api";

/* =========================
   TYPES
========================= */
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
  const navigation = useNavigation<ProfileNavigationProp>();

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

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

  const { profile, payments } = data;

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
          <StatCard 
            icon="calendar" 
            color="#2196F3" 
            value={new Date().getFullYear() - new Date(user.createdAt).getFullYear()} 
            label="Anni attivo" 
          />
          <StatCard 
            icon="checkmark-circle" 
            color="#4CAF50" 
            value={profile.matchesPlayed > 0 ? Math.round((profile.matchesPlayed / (profile.matchesPlayed + 2)) * 100) : 0} 
            label="Presenza" 
          />
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

        <Text style={styles.sectionTitle}>Notifiche</Text>
        <View style={styles.card}>
          <PreferenceRow 
            icon="notifications-outline" 
            title="Notifiche push" 
            subtitle="Aggiornamenti prenotazioni" 
            value={pushNotifications} 
            onChange={setPushNotifications} 
          />
          <Divider />
          <PreferenceRow 
            icon="moon-outline" 
            title="Tema scuro" 
            subtitle="In arrivo" 
            value={darkMode} 
            onChange={setDarkMode} 
            disabled 
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

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  
  loading: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12 
  },
  
  loadingText: { 
    color: "#666", 
    fontWeight: "600", 
    fontSize: 16 
  },
  
  hero: { 
    backgroundColor: "white", 
    alignItems: "center", 
    paddingTop: 24, 
    paddingBottom: 32 
  },
  
  avatarContainer: { 
    position: "relative", 
    marginBottom: 16 
  },
  
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "#2196F3", 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 4, 
    borderColor: "white", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4 
  },
  
  avatarText: { 
    color: "white", 
    fontSize: 36, 
    fontWeight: "800" 
  },
  
  editAvatarButton: { 
    position: "absolute", 
    bottom: 0, 
    right: 0, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: "#4CAF50", 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 3, 
    borderColor: "white" 
  },
  
  name: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1a1a1a", 
    marginBottom: 4 
  },
  
  email: { 
    color: "#666", 
    fontSize: 14, 
    marginBottom: 12 
  },
  
  memberBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    backgroundColor: "#E3F2FD", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  
  memberText: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: "#2196F3" 
  },
  
  stats: { 
    flexDirection: "row", 
    gap: 12, 
    paddingHorizontal: 16, 
    marginTop: -20, 
    marginBottom: 16 
  },
  
  statCard: { 
    flex: 1, 
    backgroundColor: "white", 
    borderRadius: 16, 
    padding: 16, 
    alignItems: "center", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  
  statIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 8 
  },
  
  statValue: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#1a1a1a", 
    marginBottom: 4 
  },
  
  statLabel: { 
    fontSize: 11, 
    color: "#999", 
    fontWeight: "600", 
    textAlign: "center" 
  },
  
  favorite: { 
    backgroundColor: "#FFEBEE", 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: "#F44336", 
    borderStyle: "dashed" 
  },
  
  favoriteHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginBottom: 8 
  },
  
  favoriteTitle: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: "#F44336" 
  },
  
  favoriteName: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#1a1a1a" 
  },
  
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: "800", 
    color: "#999", 
    textTransform: "uppercase", 
    letterSpacing: 0.5, 
    marginLeft: 16, 
    marginBottom: 12 
  },
  
  card: { 
    backgroundColor: "white", 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    padding: 16, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  
  menuItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  
  menuIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  
  menuTitle: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#1a1a1a", 
    marginBottom: 2 
  },
  
  menuSubtitle: { 
    fontSize: 13, 
    color: "#666" 
  },
  
  prefRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  
  prefIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  
  divider: { 
    height: 1, 
    backgroundColor: "#f0f0f0", 
    marginVertical: 16 
  },
  
  logout: { 
    marginHorizontal: 16, 
    marginTop: 8, 
    padding: 16, 
    borderRadius: 12, 
    backgroundColor: "#FFEBEE", 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    gap: 8, 
    borderWidth: 1.5, 
    borderColor: "#F44336" 
  },
  
  logoutText: { 
    color: "#F44336", 
    fontWeight: "700", 
    fontSize: 16 
  },
  
  version: { 
    textAlign: "center", 
    color: "#999", 
    fontSize: 12, 
    marginTop: 20 
  },
});
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useColorScheme,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback, memo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Network from 'expo-network';

import API_URL from "../../config/api";
import { Avatar } from "../../components/Avatar";
import { useCustomAlert } from "../../components/CustomAlert";
import { AvatarPicker } from "../../components/AvatarPicker";
import { resolveAvatarUrl } from "../../utils/avatar";

// ==================== TIPI ====================
interface OwnerStats {
  strutture: number;
  prenotazioni: number;
  incassoTotale: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  role: string;
}

interface ProfileResponse {
  user: User;
}

interface Booking {
  id: string;
  status: string;
  price: number;
  [key: string]: any;
}

interface Struttura {
  id: string;
  [key: string]: any;
}

// ==================== UTILITY FUNCTIONS ====================

// ==================== CUSTOM HOOKS ====================
const useOwnerProfile = (token: string | null) => {
  const [stats, setStats] = useState<OwnerStats>({
    strutture: 0,
    prenotazioni: 0,
    incassoTotale: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setError("Token non disponibile");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileRes, struttureRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/strutture/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/bookings/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Gestione errori
      if (!profileRes.ok) {
        const errorText = await profileRes.text();
        throw new Error(`HTTP ${profileRes.status}: ${errorText || "Errore caricamento profilo"}`);
      }

      const profileData: ProfileResponse = await profileRes.json();
      
      // Carica statistiche
      const strutture: Struttura[] = struttureRes.ok ? await struttureRes.json() : [];
      const bookings: Booking[] = bookingsRes.ok ? await bookingsRes.json() : [];
      
      const incasso = bookings
        .filter((b) => b.status === "confirmed")
        .reduce((sum, b) => sum + (b.price || 0), 0);

      setStats({
        strutture: strutture.length,
        prenotazioni: bookings.length,
        incassoTotale: incasso,
      });

      return profileData.user;
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { stats, loading, error, fetchProfile, setError };
};

const useAvatarManager = (
  token: string | null,
  user: User | null,
  updateUser: ((updatedUser: Partial<User>) => void) | null,
  showAlert: any,
  fetchProfile: () => Promise<void>
) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
      setAvatarError(false);
    }
  }, [user?.avatarUrl]);

  const validateImage = (size: number): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return size <= maxSize;
  };

  const uploadAvatar = useCallback(async (imageUri: string) => {
    if (!token) {
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Token non disponibile',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      setUploading(true);

      // Validazione dimensioni immagine
      const response = await fetch(imageUri);
      const blob = await response.blob();

      if (!validateImage(blob.size)) {
        showAlert({
          type: 'warning',
          title: 'Immagine troppo grande',
          message: 'L\'immagine deve essere massimo 5MB',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        const newAvatarUrl = json.avatarUrl;
        setAvatarUrl(newAvatarUrl);
        setAvatarError(false);
        setAvatarRefreshKey(prev => prev + 1);

        if (updateUser && user) {
          updateUser({ ...user, avatarUrl: newAvatarUrl });
        }

        // ✅ Ricarica il profilo
        await fetchProfile();

        showAlert({
          type: 'success',
          title: 'Perfetto!',
          message: 'La tua immagine profilo è stata aggiornata con successo',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Ops!',
          message: json.message || 'Non siamo riusciti a caricare l\'immagine. Riprova.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      showAlert({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Verifica la tua connessione internet e riprova',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setUploading(false);
    }
  }, [token, user, updateUser, showAlert, fetchProfile]);

  const removeAvatar = useCallback(async () => {
    if (!token) {
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Token non disponibile',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      setUploading(true);
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAvatarUrl(null);
        setAvatarError(false);
        setAvatarRefreshKey(prev => prev + 1);

        if (updateUser && user) {
          updateUser({ ...user, avatarUrl: undefined });
        }

        // ✅ Ricarica il profilo
        await fetchProfile();

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
    } finally {
      setUploading(false);
    }
  }, [token, user, updateUser, showAlert, fetchProfile]);

  const handleAvatarError = useCallback(() => {
    console.warn("Failed to load avatar, falling back to placeholder");
    setAvatarError(true);
  }, []);

  return {
    avatarUrl,
    avatarError,
    avatarRefreshKey,
    uploading,
    uploadAvatar,
    removeAvatar,
    handleAvatarError,
  };
};

// Hook per controllo connessione (compatibile con React Native)
const useNetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkNetworkStatus = async () => {
      try {
        // Usa expo-network per controllare lo stato della connessione
        const networkState = await Network.getNetworkStateAsync();
        
        if (isMounted) {
          setIsOffline(!networkState.isConnected);
        }
      } catch (error) {
        console.error("Error checking network status:", error);
        if (isMounted) {
          setIsOffline(true);
        }
      }
    };

    // Controlla lo stato iniziale
    checkNetworkStatus();

    // Controlla periodicamente lo stato della rete (ogni 10 secondi)
    const intervalId = setInterval(checkNetworkStatus, 10000);

    // Usa AppState per ri-controllare quando l'app diventa attiva
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkNetworkStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  return isOffline;
};

// ==================== COMPONENTI MEMOIZZATI ====================
interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

const StatCard = memo<StatCardProps>(({ icon, iconColor, iconBg, label, value }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon as any} size={24} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

StatCard.displayName = 'StatCard';

interface MenuCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const MenuCard = memo<MenuCardProps>(({ icon, iconColor, iconBg, title, subtitle, onPress }) => (
  <Pressable 
    style={styles.menuCard} 
    onPress={onPress}
    accessibilityLabel={title}
    accessibilityHint={`Premi per ${subtitle.toLowerCase()}`}
    accessibilityRole="button"
  >
    <View style={styles.menuLeft}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </Pressable>
));

MenuCard.displayName = 'MenuCard';

interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
}

const InfoCard = memo<InfoCardProps>(({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon as any} size={20} color="#666" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
));

InfoCard.displayName = 'InfoCard';

// ==================== SKELETON LOADER ====================
const SkeletonLoader = () => (
  <SafeAreaView style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Skeleton Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: '#e0e0e0' }]} />
          <View style={styles.headerInfo}>
            <View style={[styles.skeletonLine, { width: '60%', marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { width: '80%', marginBottom: 12 }]} />
            <View style={[styles.skeletonLine, { width: '30%' }]} />
          </View>
        </View>
      </View>

      {/* Skeleton Stats */}
      <View style={styles.statsContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e0e0e0' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginBottom: 4 }]} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
          </View>
        ))}
      </View>

      {/* Skeleton Menu Items */}
      {[1, 2, 3].map((section) => (
        <View key={section} style={styles.section}>
          <View style={[styles.skeletonLine, { width: '40%', marginBottom: 16 }]} />
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.menuCard, { backgroundColor: '#f0f0f0' }]}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#e0e0e0' }]} />
                <View style={styles.menuText}>
                  <View style={[styles.skeletonLine, { width: '70%', marginBottom: 4 }]} />
                  <View style={[styles.skeletonLine, { width: '50%' }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
);

// ==================== COMPONENTE PRINCIPALE ====================
export default function OwnerProfileScreen() {
  const { token, logout, user, updateUser } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { showAlert, AlertComponent } = useCustomAlert();

  const { stats, loading, error, fetchProfile, setError } = useOwnerProfile(token);
  const {
    avatarUrl,
    avatarError,
    avatarRefreshKey,
    uploading,
    uploadAvatar,
    removeAvatar,
    handleAvatarError,
  } = useAvatarManager(token, user, updateUser, showAlert, fetchProfile);

  const [refreshing, setRefreshing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Usa il nuovo hook per il controllo della connessione
  const isOffline = useNetworkStatus();

  // Fetch iniziale
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    if (isOffline) {
      Alert.alert("Offline", "Non sei connesso a Internet");
      return;
    }
    
    setRefreshing(true);
    try {
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, isOffline]);

  const changeAvatar = useCallback(() => {
    if (uploading) return;
    setShowAvatarPicker(true);
  }, [uploading]);

  const pickImageFromGallery = useCallback(async () => {
    if (uploading) return;

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

      // ✅ CORREZIONE: usa ImagePicker.MediaType invece di ImagePicker.MediaTypeOptions
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images', // <-- Correzione qui
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
  }, [uploadAvatar, uploading, showAlert]);

  const takePhotoWithCamera = useCallback(async () => {
    if (uploading) return;

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
  }, [uploadAvatar, uploading, showAlert]);


  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Cancella account",
      "Sei sicuro? Questa azione è irreversibile e cancellerà tutte le tue strutture e prenotazioni.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma cancellazione",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/users/me`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (res.ok) {
                Alert.alert("Account cancellato", "Il tuo account è stato cancellato con successo.");
                logout();
              } else {
                Alert.alert("Errore", "Impossibile cancellare l'account");
              }
            } catch (err) {
              console.error("Delete account error:", err);
              Alert.alert("Errore", "Impossibile cancellare l'account");
            }
          },
        },
      ]
    );
  }, [token, logout]);

  // ==================== RENDER ====================
  if (loading && !refreshing) {
    return <SkeletonLoader />;
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={[styles.safe, isDarkMode && styles.darkSafe]}>
        <View style={styles.center}>
          <View style={[styles.errorIcon, isDarkMode && styles.darkErrorIcon]}>
            <Ionicons name="alert-circle" size={64} color="#E53935" />
          </View>
          <Text style={[styles.errorTitle, isDarkMode && styles.darkText]}>{error}</Text>
          
          {isOffline && (
            <Text style={[styles.offlineText, isDarkMode && styles.darkOfflineText]}>
              ⚠️ Sei offline
            </Text>
          )}
          
          <Pressable 
            style={[styles.retryButton, isOffline && styles.disabledButton]} 
            onPress={fetchProfile}
            disabled={isOffline}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryText}>Riprova</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Calcola URL avatar finale
  const finalAvatarUrl = resolveAvatarUrl(avatarError ? null : avatarUrl);
  const shouldShowAvatar = finalAvatarUrl && !avatarError;

  return (
    <SafeAreaView style={[styles.safe, isDarkMode && styles.darkSafe]}>
      <AlertComponent />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2196F3"]}
            tintColor="#2196F3"
            enabled={!isOffline}
          />
        }
      >
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="wifi-outline" size={16} color="white" />
            <Text style={styles.offlineBannerText}>Sei offline</Text>
          </View>
        )}

        {/* HEADER CON AVATAR */}
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.avatar}
              onPress={changeAvatar}
              accessibilityLabel="Cambia immagine profilo"
              accessibilityHint="Premi per cambiare la tua foto profilo"
              accessibilityRole="button"
              disabled={uploading}
            >
              {uploading ? (
                <View style={[styles.avatarPlaceholder, styles.uploadingAvatar]}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : (
                <Avatar
                  key={`avatar-${avatarRefreshKey}`}
                  name={user?.name}
                  surname={user?.surname}
                  avatarUrl={avatarUrl}
                  size="large"
                />
              )}
              <View style={styles.ownerBadge}>
                <Ionicons name="business" size={14} color="white" />
              </View>
            </Pressable>

            <View style={styles.headerInfo}>
              <Text style={[styles.name, isDarkMode && styles.darkText]}>{user?.name}</Text>
              <Text style={[styles.email, isDarkMode && styles.darkSubtext]}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.roleText}>Proprietario</Text>
              </View>
            </View>
          </View>
        </View>

        {/* STATISTICHE */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="business-outline"
            iconColor="#2196F3"
            iconBg={isDarkMode ? "#1E3A5F" : "#E3F2FD"}
            label="Strutture"
            value={stats.strutture.toString()}
          />
          <StatCard
            icon="calendar-outline"
            iconColor="#4CAF50"
            iconBg={isDarkMode ? "#1B3A2E" : "#E8F5E9"}
            label="Prenotazioni"
            value={stats.prenotazioni.toString()}
          />
          <StatCard
            icon="cash-outline"
            iconColor="#FF9800"
            iconBg={isDarkMode ? "#3E2E1B" : "#FFF3E0"}
            label="Incasso"
            value={`€${stats.incassoTotale.toLocaleString('it-IT')}`}
          />
        </View>

        {/* GESTIONE RAPIDA */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Gestione rapida</Text>
          
          <MenuCard
            icon="business"
            iconColor="#2196F3"
            iconBg={isDarkMode ? "#1E3A5F" : "#E3F2FD"}
            title="Le mie strutture"
            subtitle={stats.strutture === 1 ? "1 struttura attiva" : `${stats.strutture} strutture attive`}
            onPress={() => navigation.navigate("OwnerStrutture")}
          />

          <MenuCard
            icon="calendar"
            iconColor="#4CAF50"
            iconBg={isDarkMode ? "#1B3A2E" : "#E8F5E9"}
            title="Prenotazioni ricevute"
            subtitle={stats.prenotazioni === 1 ? "1 prenotazione" : `${stats.prenotazioni} prenotazioni`}
            onPress={() => navigation.navigate("OwnerBookings")}
          />

          <MenuCard
            icon="cash"
            iconColor="#FF9800"
            iconBg={isDarkMode ? "#3E2E1B" : "#FFF3E0"}
            title="Pagamenti e incassi"
            subtitle="Gestisci i tuoi pagamenti"
            onPress={() => navigation.navigate("OwnerPayments")}
          />
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Account</Text>
          
          <InfoCard
            icon="person-outline"
            label="Nome completo"
            value={user?.name || ""}
          />
          
          <InfoCard
            icon="mail-outline"
            label="Email"
            value={user?.email || ""}
          />
          
          <InfoCard
            icon="calendar-outline"
            label="Membro dal"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("it-IT", {
              month: "long",
              year: "numeric",
            }) : ""}
          />
        </View>

        {/* IMPOSTAZIONI */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Impostazioni</Text>
          
          <MenuCard
            icon="settings-outline"
            iconColor={isDarkMode ? "#aaa" : "#666"}
            iconBg={isDarkMode ? "#2a2a2a" : "#f5f5f5"}
            title="Preferenze"
            subtitle="Gestisci le tue preferenze"
            onPress={() => navigation.navigate("Preferences")}
          />

          <MenuCard
            icon="notifications-outline"
            iconColor={isDarkMode ? "#aaa" : "#666"}
            iconBg={isDarkMode ? "#2a2a2a" : "#f5f5f5"}
            title="Notifiche"
            subtitle="Gestisci notifiche e avvisi"
            onPress={() => navigation.navigate("Notifications")}
          />

          <MenuCard
            icon="shield-checkmark-outline"
            iconColor={isDarkMode ? "#aaa" : "#666"}
            iconBg={isDarkMode ? "#2a2a2a" : "#f5f5f5"}
            title="Privacy e sicurezza"
            subtitle="Gestisci password e privacy"
            onPress={() => navigation.navigate("Privacy")}
          />

          <MenuCard
            icon="help-circle-outline"
            iconColor={isDarkMode ? "#aaa" : "#666"}
            iconBg={isDarkMode ? "#2a2a2a" : "#f5f5f5"}
            title="Supporto"
            subtitle="FAQ e contatti"
            onPress={() => navigation.navigate("Support")}
          />

          <MenuCard
            icon="trash-outline"
            iconColor="#E53935"
            iconBg={isDarkMode ? "#3A1E1E" : "#FFEBEE"}
            title="Cancella account"
            subtitle="Elimina definitivamente il tuo account"
            onPress={handleDeleteAccount}
          />
        </View>

        {/* LOGOUT */}
        <Pressable 
          style={[styles.logoutButton, isDarkMode && styles.darkLogoutButton]} 
          onPress={logout}
          accessibilityLabel="Esci dall'account"
          accessibilityHint="Premi per uscire dal tuo account"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </Pressable>

        <Text style={[styles.version, isDarkMode && styles.darkSubtext]}>Versione App 2.4.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
  },
  darkSafe: {
    backgroundColor: "#121212",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  // Skeleton
  skeletonLine: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
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
  darkErrorIcon: {
    backgroundColor: "#3A1E1E",
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
  darkOfflineText: {
    color: "#aaa",
  },

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

  // HEADER
  header: {
    backgroundColor: "white",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  darkHeader: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#000",
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    position: "relative",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingAvatar: {
    opacity: 0.7,
  },

  avatarText: { 
    fontSize: 32, 
    fontWeight: "800",
    color: "white",
  },

  ownerBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
  },

  headerInfo: {
    flex: 1,
  },

  name: { 
    fontSize: 22, 
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  darkText: {
    color: "#ffffff",
  },

  email: { 
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  darkSubtext: {
    color: "#aaa",
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF9800",
  },

  // STATISTICHE
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
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
    elevation: 2,
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  // SEZIONI
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // MENU CARD
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  menuText: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },

  menuSubtitle: {
    fontSize: 13,
    color: "#666",
  },

  // INFO CARD
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  // LOGOUT
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
  darkLogoutButton: {
    backgroundColor: "#3A1E1E",
  },

  logoutText: { 
    color: "#E53935", 
    fontWeight: "800",
    fontSize: 16,
  },

  version: {
    textAlign: "center",
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
});
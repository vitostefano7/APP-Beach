import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacySecurityScreen() {
  const navigation = useNavigation<any>();

  const handleChangePassword = () => {
    Alert.alert("Cambia password", "Funzionalità in arrivo");
  };

  const handleTwoFactor = () => {
    Alert.alert("Autenticazione a due fattori", "Funzionalità in arrivo");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Elimina account",
      "Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: () => Alert.alert("Account eliminato", "Funzionalità in arrivo"),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy e sicurezza</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            La tua sicurezza è la nostra priorità. Gestisci le tue impostazioni di privacy
          </Text>
        </View>

        {/* SICUREZZA */}
        <Text style={styles.sectionTitle}>Sicurezza</Text>
        <View style={styles.card}>
          <Pressable style={styles.item} onPress={handleChangePassword}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="key-outline" size={22} color="#2196F3" />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Cambia password</Text>
                <Text style={styles.itemSubtitle}>Ultima modifica 3 mesi fa</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.item} onPress={handleTwoFactor}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#4CAF50" />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Autenticazione a due fattori</Text>
                <Text style={styles.itemSubtitle}>Non attiva</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>
        </View>

        {/* PRIVACY */}
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <Pressable style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="eye-outline" size={22} color="#FF9800" />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Visibilità profilo</Text>
                <Text style={styles.itemSubtitle}>Pubblico</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="analytics-outline" size={22} color="#9C27B0" />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Condivisione dati</Text>
                <Text style={styles.itemSubtitle}>Gestisci le tue preferenze</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>
        </View>

        {/* SESSIONI */}
        <Text style={styles.sectionTitle}>Sessioni attive</Text>
        <View style={styles.card}>
          <View style={styles.sessionItem}>
            <View style={styles.sessionLeft}>
              <View style={[styles.itemIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="phone-portrait-outline" size={22} color="#2196F3" />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDevice}>iPhone 14 Pro</Text>
                <Text style={styles.sessionLocation}>Milano, Italia</Text>
                <Text style={styles.sessionTime}>Attiva ora</Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
            </View>
          </View>
        </View>

        {/* ZONA PERICOLO */}
        <Text style={styles.sectionTitle}>Zona pericolo</Text>
        <View style={styles.dangerCard}>
          <Pressable style={styles.dangerItem} onPress={handleDeleteAccount}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="trash-outline" size={22} color="#F44336" />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: "#F44336" }]}>Elimina account</Text>
                <Text style={styles.itemSubtitle}>
                  Questa azione è permanente e irreversibile
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  container: {
    flex: 1,
    padding: 16,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E8F5E9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#666",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },

  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  sessionLocation: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: "#999",
  },
  activeBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },

  dangerCard: {
    backgroundColor: "#FFEBEE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F44336",
  },
  dangerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
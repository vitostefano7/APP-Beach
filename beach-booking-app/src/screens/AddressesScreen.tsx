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
import { useState } from "react";

export default function AddressesScreen() {
  const navigation = useNavigation<any>();
  const [addresses, setAddresses] = useState([
    {
      id: "1",
      type: "home",
      label: "Casa",
      street: "Via Roma 123",
      city: "Milano",
      zipCode: "20121",
      isDefault: true,
    },
    {
      id: "2",
      type: "work",
      label: "Ufficio",
      street: "Corso Buenos Aires 45",
      city: "Milano",
      zipCode: "20124",
      isDefault: false,
    },
  ]);

  const handleAddAddress = () => {
    Alert.alert("Aggiungi indirizzo", "Funzionalità in arrivo");
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert("Elimina indirizzo", "Sei sicuro di voler eliminare questo indirizzo?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => setAddresses(addresses.filter((a) => a.id !== id)),
      },
    ]);
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return { icon: "home", color: "#4CAF50", bg: "#E8F5E9" };
      case "work":
        return { icon: "business", color: "#2196F3", bg: "#E3F2FD" };
      default:
        return { icon: "location", color: "#FF9800", bg: "#FFF3E0" };
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Indirizzi salvati</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Gestisci i tuoi indirizzi per ricevere aggiornamenti sulle strutture vicine
          </Text>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nessun indirizzo salvato</Text>
            <Text style={styles.emptyText}>Aggiungi un indirizzo per iniziare</Text>
          </View>
        ) : (
          <View style={styles.addressesContainer}>
            {addresses.map((address) => {
              const iconData = getAddressIcon(address.type);
              return (
                <View key={address.id} style={styles.addressItem}>
                  <View style={styles.addressLeft}>
                    <View style={[styles.addressIcon, { backgroundColor: iconData.bg }]}>
                      <Ionicons name={iconData.icon as any} size={24} color={iconData.color} />
                    </View>
                    <View style={styles.addressInfo}>
                      <View style={styles.addressHeader}>
                        <Text style={styles.addressLabel}>{address.label}</Text>
                        {address.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Predefinito</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressStreet}>{address.street}</Text>
                      <Text style={styles.addressCity}>
                        {address.city}, {address.zipCode}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAddress(address.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <Pressable style={styles.addButton} onPress={handleAddAddress}>
          <Ionicons name="add-circle" size={24} color="#2196F3" />
          <Text style={styles.addButtonText}>Aggiungi nuovo indirizzo</Text>
        </Pressable>

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
    backgroundColor: "#E3F2FD",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "500",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  addressesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addressLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  defaultBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4CAF50",
  },
  addressStreet: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  addressCity: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2196F3",
  },
});
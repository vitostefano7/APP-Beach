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

export default function PaymentMethodsScreen() {
  const navigation = useNavigation<any>();
  const [cards, setCards] = useState([
    { id: "1", last4: "4242", brand: "Visa", expMonth: 12, expYear: 2025, isDefault: true },
    { id: "2", last4: "5555", brand: "Mastercard", expMonth: 8, expYear: 2026, isDefault: false },
  ]);

  const handleAddCard = () => {
    Alert.alert("Aggiungi carta", "Funzionalità in arrivo");
  };

  const handleDeleteCard = (id: string) => {
    Alert.alert(
      "Elimina carta",
      "Sei sicuro di voler eliminare questo metodo di pagamento?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: () => setCards(cards.filter((c) => c.id !== id)),
        },
      ]
    );
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "card";
      case "mastercard":
        return "card";
      default:
        return "card-outline";
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Metodi di pagamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            I tuoi dati di pagamento sono protetti e crittografati
          </Text>
        </View>

        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nessun metodo di pagamento</Text>
            <Text style={styles.emptyText}>
              Aggiungi una carta per velocizzare i pagamenti
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {cards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIcon, { backgroundColor: "#E3F2FD" }]}>
                    <Ionicons name={getCardIcon(card.brand) as any} size={24} color="#2196F3" />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardBrand}>{card.brand}</Text>
                      {card.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Predefinita</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                    <Text style={styles.cardExpiry}>
                      Scade {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCard(card.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable style={styles.addButton} onPress={handleAddCard}>
          <Ionicons name="add-circle" size={24} color="#2196F3" />
          <Text style={styles.addButtonText}>Aggiungi nuova carta</Text>
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

  cardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  cardItem: {
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
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardBrand: {
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
  cardNumber: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  cardExpiry: {
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
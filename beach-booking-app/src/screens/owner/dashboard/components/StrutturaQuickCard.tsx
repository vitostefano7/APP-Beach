import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { styles } from "../styles/OwnerDashboardScreen.styles";
import { resolveImageUrl } from "../../../../utils/imageUtils";

interface Struttura {
  _id: string;
  name: string;
  location: {
    city: string;
    address: string;
  };
  images: string[];
  isActive: boolean;
}

interface StrutturaQuickCardProps {
  struttura: Struttura;
  todayBookingsCount: number;
  onPress: () => void;
}

export default function StrutturaQuickCard({
  struttura,
  todayBookingsCount,
  onPress,
}: StrutturaQuickCardProps) {
  const imageUrl = struttura.images?.[0]
    ? resolveImageUrl(struttura.images[0])
    : null;

  return (
    <Pressable style={styles.strutturaCard} onPress={onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.strutturaImage} />
      ) : (
        <View style={styles.strutturaImagePlaceholder}>
          <Ionicons name="business" size={40} color="#ccc" />
        </View>
      )}

      <View style={styles.strutturaOverlay}>
        <View
          style={[
            styles.strutturaStatusBadge,
            { backgroundColor: struttura.isActive ? "#4CAF50" : "#999" },
          ]}
        >
          <Text style={styles.strutturaStatusText}>
            {struttura.isActive ? "Attiva" : "Non attiva"}
          </Text>
        </View>
      </View>

      <View style={styles.strutturaInfo}>
        <Text style={styles.strutturaName} numberOfLines={1}>
          {struttura.name}
        </Text>
        <View style={styles.strutturaLocation}>
          <Ionicons name="location" size={12} color="#666" />
          <Text style={styles.strutturaCityText} numberOfLines={1}>
            {struttura.location.address}
          </Text>
        </View>

        {todayBookingsCount > 0 && (
          <View style={styles.strutturaBookingsBadge}>
            <Ionicons name="calendar" size={12} color="#2196F3" />
            <Text style={styles.strutturaBookingsText}>
              {todayBookingsCount} {todayBookingsCount === 1 ? "prenotazione oggi" : "prenotazioni oggi"}
            </Text>
          </View>
        )}
      </View>

      <Pressable style={styles.dettagliButton} onPress={onPress}>
        <Text style={styles.dettagliButtonText}>Dettagli</Text>
        <Ionicons name="chevron-forward" size={14} color="white" />
      </Pressable>
    </Pressable>
  );
}

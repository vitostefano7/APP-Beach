import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import styles from "./InvitoScaduto.styles"; // Crea questo file di stili

export default function InvitoScadutoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token, user } = useContext(AuthContext);
  
  const { inviteId, inviteData, timeSinceExpiration } = route.params;
  const [loading, setLoading] = useState(!inviteData);
  const [invite, setInvite] = useState<any>(inviteData);
  const [matchDetails, setMatchDetails] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      if (inviteData) {
        setInvite(inviteData);
        setLoading(false);
      } else if (inviteId) {
        loadInviteDetails();
      }
    }, [inviteId, inviteData])
  );

  const loadInviteDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/matches/${inviteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setInvite(data);
        setMatchDetails(data);
      }
    } catch (error) {
      console.error("Errore caricamento invito:", error);
      Alert.alert("Errore", "Impossibile caricare i dettagli dell'invito");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Data non disponibile";
    
    try {
      const date = new Date(dateStr + "T12:00:00");
      return date.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  const calculateExpirationTime = () => {
    const booking = invite?.booking || invite?.match?.booking;
    if (!booking?.date || !booking?.startTime) return "Tempo non disponibile";
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2); // Scade 2 ore prima
      
      const now = new Date();
      const hoursDiff = Math.floor((now.getTime() - cutoffTime.getTime()) / (1000 * 60 * 60));
      
      if (hoursDiff < 24) {
        return `Scaduto ${hoursDiff} ore fa`;
      } else {
        const daysDiff = Math.floor(hoursDiff / 24);
        return `Scaduto ${daysDiff} giorni fa`;
      }
    } catch (error) {
      return timeSinceExpiration || "Scaduto";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#757575" />
          <Text style={styles.loadingText}>Caricamento dettagli...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!invite) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#757575" />
          <Text style={styles.errorTitle}>Invito non trovato</Text>
          <Text style={styles.errorSubtitle}>L'invito potrebbe essere stato rimosso</Text>
        </View>
      </SafeAreaView>
    );
  }

  const match = invite.match || invite;
  const booking = invite.booking || match?.booking;
  const createdBy = invite.createdBy || match?.createdBy;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header con icona di scaduto */}
        <View style={styles.header}>
          <View style={styles.expiredIconContainer}>
            <Ionicons name="time-outline" size={48} color="#757575" />
          </View>
          <Text style={styles.headerTitle}>Invito Scaduto</Text>
          <Text style={styles.headerSubtitle}>
            {calculateExpirationTime()}
          </Text>
        </View>

        {/* Messaggio di spiegazione */}
        <View style={styles.explanationCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <Text style={styles.explanationText}>
            Questo invito è scaduto 2 ore prima dell'orario della partita. 
            Non è più possibile rispondere all'invito.
          </Text>
        </View>

        {/* Dettagli invito */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Dettagli invito</Text>
          
          {/* Chi ha invitato */}
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Da:</Text>
              <View style={styles.creatorInfo}>
                {createdBy?.avatarUrl ? (
                  <Image
                    source={{ uri: `${API_URL}${createdBy.avatarUrl}` }}
                    style={styles.creatorAvatar}
                  />
                ) : (
                  <View style={styles.creatorAvatarPlaceholder}>
                    <Ionicons name="person" size={16} color="#999" />
                  </View>
                )}
                <Text style={styles.creatorName}>
                  {createdBy?.name || "Utente sconosciuto"}
                </Text>
              </View>
            </View>
          </View>

          {/* Struttura */}
          {booking?.campo?.struttura?.name && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Struttura:</Text>
                <Text style={styles.detailValue}>
                  {booking.campo.struttura.name}
                </Text>
              </View>
            </View>
          )}

          {/* Data */}
          {booking?.date && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Data:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(booking.date)}
                </Text>
              </View>
            </View>
          )}

          {/* Orario */}
          {booking?.startTime && booking?.endTime && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Orario:</Text>
                <Text style={styles.detailValue}>
                  {booking.startTime} - {booking.endTime}
                </Text>
              </View>
            </View>
          )}

          {/* Giocatori confermati */}
          {match?.players && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Giocatori confermati:</Text>
                <Text style={styles.detailValue}>
                  {match.players.filter((p: any) => p.status === "confirmed").length} /{" "}
                  {match.maxPlayers || match.players.length}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Lista giocatori (opzionale) */}
        {match?.players && match.players.length > 0 && (
          <View style={styles.playersCard}>
            <Text style={styles.playersTitle}>Giocatori invitati</Text>
            {match.players.slice(0, 5).map((player: any, index: number) => (
              <View key={index} style={styles.playerRow}>
                <View style={styles.playerInfo}>
                  {player.user?.avatarUrl ? (
                    <Image
                      source={{ uri: `${API_URL}${player.user.avatarUrl}` }}
                      style={styles.playerAvatar}
                    />
                  ) : (
                    <View style={styles.playerAvatarPlaceholder}>
                      <Ionicons name="person" size={16} color="#999" />
                    </View>
                  )}
                  <Text style={styles.playerName}>
                    {player.user?.name || "Giocatore"}
                  </Text>
                </View>
                <View style={[
                  styles.playerStatusBadge,
                  player.status === "confirmed" && styles.confirmedBadge,
                  player.status === "pending" && styles.pendingBadge,
                  player.status === "declined" && styles.declinedBadge,
                ]}>
                  <Text style={styles.playerStatusText}>
                    {player.status === "confirmed" ? "Accettato" :
                     player.status === "pending" ? "In attesa" :
                     player.status === "declined" ? "Rifiutato" : player.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Azioni */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Cosa puoi fare</Text>
          
          <View style={styles.actionItem}>
            <Ionicons name="calendar-outline" size={24} color="#2196F3" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Crea una nuova partita</Text>
              <Text style={styles.actionDescription}>
                Organizza una partita simile con gli stessi giocatori
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>

          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={24} color="#2196F3" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Contatta l'organizzatore</Text>
              <Text style={styles.actionDescription}>
                Chiedi se ci sarà un'altra partita simile
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </ScrollView>

      {/* Bottone indietro */}
      <View style={styles.footer}>
        <View style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#2196F3" />
          <Text style={styles.backButtonText}>Torna agli inviti</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
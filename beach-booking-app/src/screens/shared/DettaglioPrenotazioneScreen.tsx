import React, { useContext, useEffect, useState, useRef } from "react";
import { SafeAreaView, View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Linking, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import API_URL from "../../config/api";

// Centralized components
import MatchSection from "../../components/booking/MatchSection";
import InviteModal from "../../components/booking/InviteModal";
import OwnerRoleSection from "../../components/booking/OwnerRoleSection";
import PlayerRoleSection from "../../components/booking/PlayerRoleSection";
import { useMatchLogic } from "../../hooks/booking/useMatchLogic";
import { getTeamColors, getTeamIcon } from "../../utils/booking/bookingUtils";

// Other components
import ScoreModal from "../../components/ScoreModal";
import { submitMatchScore } from "../player/prenotazioni/DettaglioPrenotazione/utils/DettaglioPrenotazione.utils";
import BookingDetailsCard from "../player/prenotazioni/DettaglioPrenotazione/components/BookingDetailsCard";
import { calculateDuration } from "../player/prenotazioni/DettaglioPrenotazione/utils/DettaglioPrenotazione.utils";
import { AnimatedCard } from "../player/prenotazioni/DettaglioPrenotazione/components/AnimatedComponents";
import { Avatar } from "../../components/Avatar";

interface DettaglioPrenotazioneScreenProps {
  role: 'player' | 'owner';
}

export default function DettaglioPrenotazioneScreen({ role }: DettaglioPrenotazioneScreenProps) {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [loadingGroupChat, setLoadingGroupChat] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);

  // Score modal visibility
  const [scoreModalVisible, setScoreModalVisible] = useState(false);

  // Invite modal states
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteToTeam, setInviteToTeam] = useState<"A" | "B" | null>(null);
  const [inviteToSlot, setInviteToSlot] = useState<number | null>(null);

  const loadBooking = async () => {
    if (!token) return;

    try {
      const endpoint = role === 'owner' ? `${API_URL}/api/bookings/owner/${bookingId}` : `${API_URL}/api/bookings/${bookingId}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Errore nel caricamento della prenotazione");
      }

      const data = await res.json();
      setBooking(data);
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerUserId: string) => {
    if (!booking?.match?._id || !token) return;

    Alert.alert(
      "Rimuovi giocatore",
      "Sei sicuro di voler rimuovere questo giocatore dal match?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rimuovi",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/api/matches/${booking.match._id}/remove-player`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ playerUserId }),
              });

              if (!res.ok) {
                throw new Error("Errore nella rimozione del giocatore");
              }

              Alert.alert("Successo", "Giocatore rimosso dal match");
              loadBooking();
            } catch (error: any) {
              Alert.alert("Errore", error.message);
            }
          },
        },
      ]
    );
  };

  const handleInvitePlayer = async (username: string) => {
    if (!booking?.match?._id) return;

    try {
      const body: any = { 
        username,
        ...(inviteToTeam && { team: inviteToTeam })
      };

      if (inviteToSlot !== null) {
        body.slot = inviteToSlot;
      }

      const res = await fetch(`${API_URL}/api/matches/${booking.match._id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Errore nell'invito");
      }

      Alert.alert("Successo", "Invito inviato con successo");
      setInviteModalVisible(false);
      setInviteToTeam(null);
      setInviteToSlot(null);
      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  };

  const openChat = async () => {
    try {
      const userId = role === 'owner' ? booking.user._id : booking.campo.struttura.owner._id;
      const res = await fetch(`${API_URL}/api/conversations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const res2 = await fetch(`${API_URL}/api/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participantId: userId,
            strutturaId: booking.campo.struttura._id,
          }),
        });

        if (!res2.ok) {
          throw new Error();
        }

        const conversation = await res2.json();
        navigation.navigate("Chat", {
          conversationId: conversation._id,
          strutturaName: booking.campo.struttura.name,
          userName: role === 'owner' ? booking.user.name : booking.campo.struttura.owner.name,
          userId: userId,
          struttura: booking.campo.struttura,
        });
      } else {
        const conversations = await res.json();
        const conversation = conversations.find(
          (c: any) => c.struttura._id === booking.campo.struttura._id
        );

        if (conversation) {
          navigation.navigate("Chat", {
            conversationId: conversation._id,
            strutturaName: booking.campo.struttura.name,
            userName: role === 'owner' ? booking.user.name : booking.campo.struttura.owner.name,
            userId: userId,
            struttura: booking.campo.struttura,
          });
        } else {
          const res2 = await fetch(`${API_URL}/api/conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              participantId: userId,
              strutturaId: booking.campo.struttura._id,
            }),
          });

          if (!res2.ok) {
            throw new Error();
          }

          const conversation = await res2.json();
          navigation.navigate("Chat", {
            conversationId: conversation._id,
            strutturaName: booking.campo.struttura.name,
            userName: role === 'owner' ? booking.user.name : booking.campo.struttura.owner.name,
            userId: userId,
            struttura: booking.campo.struttura,
          });
        }
      }
    } catch (error) {
      Alert.alert("Errore", "Impossibile aprire la chat");
    }
  };

  const openUserProfile = (userId?: string) => {
    if (!userId || userId === user?.id) return;
    navigation.navigate('ProfiloUtente', { userId });
  };

  const handleSubmitScore = async (winner: 'A' | 'B', sets: { teamA: number; teamB: number }[]) => {
    if (!booking?.match?._id || !token) return;

    try {
      await submitMatchScore(booking.match._id, winner, sets, token);
      Alert.alert('✅ Risultato salvato!', 'Il risultato del match è stato registrato con successo');
      setScoreModalVisible(false);
      loadBooking();
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Impossibile salvare il risultato');
      throw error;
    }
  };

  const handleInviteToTeam = (team: "A" | "B", slot: number) => {
    setInviteToTeam(team);
    setInviteToSlot(slot);
    setInviteModalVisible(true);
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId, token]);

  if (loading) {
    return (
      <SafeAreaView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Prenotazione non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Ionicons name="arrow-back" size={18} color="#2196F3" />
            </View>
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}>
              <Ionicons
                name={booking.status === 'confirmed' ? 'checkmark-circle' : 'time'}
                size={16}
                color={booking.status === 'confirmed' ? '#4CAF50' : '#F44336'}
              />
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: booking.status === 'confirmed' ? '#4CAF50' : '#F44336'
              }}>
                {booking.status === 'confirmed' ? 'Confermata' : 'In attesa'}
              </Text>
            </View>
          </View>

          <View style={{ width: 32 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 30, paddingHorizontal: 16, paddingBottom: 30 }}>
          {/* Struttura Info */}
          <AnimatedCard delay={100}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                  {booking.campo.struttura.name}
                </Text>
                <Text style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
                  {booking.campo.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="football" size={16} color="#2196F3" />
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    {booking.campo.sport}
                  </Text>
                </View>
              </View>

              <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                {booking.campo.struttura.images && booking.campo.struttura.images[0] ? (
                  <Image
                    source={{ uri: booking.campo.struttura.images[0] }}
                    style={{ width: 60, height: 60, borderRadius: 8 }}
                  />
                ) : (
                  <Ionicons name="business" size={24} color="#999" />
                )}
              </View>
            </View>

            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                marginTop: 8
              }}
              onPress={() => {
                const address = `${booking.campo.struttura.address}, ${booking.campo.struttura.city}`;
                const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
                Linking.openURL(url);
              }}
            >
              <Ionicons name="location-outline" size={18} color="#666" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>
                  {booking.campo.struttura.address}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {booking.campo.struttura.city}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </Pressable>
          </AnimatedCard>

          {/* Role-specific sections */}
          {role === 'owner' && (
            <OwnerRoleSection
              booking={booking}
              onBookingUpdate={setBooking}
              openChat={openChat}
            />
          )}

          {role === 'player' && (
            <PlayerRoleSection
              booking={booking}
              onBookingUpdate={setBooking}
            />
          )}

          {/* Booking Details */}
          <AnimatedCard delay={200}>
            <BookingDetailsCard
              date={booking.date}
              startTime={booking.startTime}
              endTime={booking.endTime}
              price={booking.price}
              createdAt={booking.createdAt}
            />
          </AnimatedCard>

          {/* Match Section */}
          <MatchSection
            booking={booking}
            onBookingUpdate={setBooking}
            handleRemovePlayer={handleRemovePlayer}
            handleInviteToTeam={handleInviteToTeam}
            openUserProfile={openUserProfile}
            role={role}
          />
        </View>
      </ScrollView>

      {/* Modals */}
      <InviteModal
        visible={inviteModalVisible}
        onClose={() => {
          setInviteModalVisible(false);
          setInviteToTeam(null);
          setInviteToSlot(null);
        }}
        inviteToTeam={inviteToTeam}
        inviteToSlot={inviteToSlot}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchUsers={async (query: string) => {
          if (!token || !query.trim()) return;

          try {
            setSearching(true);
            const headers = { Authorization: `Bearer ${token}` };

            const confirmedPlayers = booking?.match?.players?.filter((p: any) => p.status === "confirmed") || [];
            const followedByIds = confirmedPlayers.map((p: any) => p.user._id).join(',');

            const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&filter=all&followedBy=${followedByIds}`, { headers });

            if (!res.ok) {
              throw new Error("Errore nella ricerca");
            }

            const data = await res.json();
            setSearchResults(data);
          } catch (error: any) {
            Alert.alert("Errore", error.message);
          } finally {
            setSearching(false);
          }
        }}
        searching={searching}
        searchResults={searchResults}
        handleInvitePlayer={handleInvitePlayer}
        suppressInvitePress={false}
      />

      {role === 'owner' && (
        <ScoreModal
          visible={scoreModalVisible}
          onClose={() => setScoreModalVisible(false)}
          onSave={handleSubmitScore}
          currentScore={booking.match?.score}
          matchStatus={booking.match?.status}
          sportType="beachvolley"
        />
      )}
    </SafeAreaView>
  );
}
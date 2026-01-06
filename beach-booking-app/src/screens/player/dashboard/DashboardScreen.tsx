import React, { useState, useContext, useRef } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Pressable,
  ActivityIndicator,
  Text,
  Alert,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import { useSuggestedFriends } from './hooks/useSuggestedFriends';
import Header from "./components/Header";
import StatsRow from "./components/StatsRow";
import NextMatchCard from "./components/NextMatchCard";
import InviteCard from "./components/InviteCard";
import RecentMatchesCarousel from "./components/RecentMatchesCarousel";
import EmptyStateCard from "./components/EmptyStateCard";
import { SuggestedFriendCard } from './components/SuggestedFriendCard';
import { styles } from "./styles";

const { width: screenWidth } = Dimensions.get('window');

const InviteCardTitle = ({ count, onViewAll }: { count: number, onViewAll: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={styles.sectionTitle}>Inviti in attesa</Text>
      {count > 0 && (
        <View style={styles.inviteCountBadge}>
          <Text style={styles.inviteCountText}>{count}</Text>
        </View>
      )}
    </View>
    <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={styles.sectionLink}>Vedi tutti</Text>
      <Ionicons name="chevron-forward" size={16} color="#2196F3" />
    </Pressable>
  </View>
);

const getValidPendingInvites = (invites: any[], userId: string) => {
  if (!invites || !userId) return [];
  
  return invites.filter(invite => {
    const match = invite.match || invite;
    const booking = invite.booking || match?.booking;
    const myPlayer = match?.players?.find((p: any) => p.user?._id === userId);
    const myStatus = myPlayer?.status || "unknown";
    
    if (myStatus !== "pending") {
      return false;
    }
    
    if (!booking?.date || !booking?.startTime) {
      return false;
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2);
      
      const isExpired = new Date() > cutoffTime;
      
      return !isExpired;
    } catch (error) {
      console.error("Errore nel calcolo scadenza invito:", error);
      return false;
    }
  });
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextBooking, setNextBooking] = useState<any>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [currentFriendIndex, setCurrentFriendIndex] = useState(0);
  
  const friendsCarouselRef = useRef<FlatList>(null);
  
  const [stats, setStats] = useState({
    totalMatches: 0,
    wins: 0,
    winRate: 0,
  });

  // Custom Hook per amici suggeriti
  const {
    suggestions: suggestedFriends,
    loading: suggestionsLoading,
    error: suggestionsError,
    refresh: refreshSuggestions,
    sendFriendRequest,
  } = useSuggestedFriends({ limit: 6 });

  useFocusEffect(
    React.useCallback(() => {
      console.log("HomeScreen focus - caricamento dati...");
      loadDashboardData();
      refreshSuggestions();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log("=== INIZIO CARICAMENTO DASHBOARD ===");
      console.log("User ID:", user?.id);
      console.log("User name:", user?.name);

      await Promise.all([
        loadNextBooking(),
        loadPendingInvites(),
        loadRecentMatchesAndStats(),
      ]);

    } catch (error) {
      console.error("Errore caricamento dashboard:", error);
    } finally {
      console.log("=== FINE CARICAMENTO DASHBOARD ===");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNextBooking = async () => {
    try {
      const bookingsRes = await fetch(`${API_URL}/bookings/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        
        console.log("TUTTE le prenotazioni ricevute:", bookings.length);
        
        const now = new Date();
        
        const relevantBookings = bookings.filter((b: any) => {
          if (b.status !== "confirmed") {
            console.log(`Booking ${b._id}: status non confermato (${b.status})`);
            return false;
          }
          
          let isFuture = false;
          try {
            const bookingDateTime = new Date(`${b.date}T${b.startTime}:00`);
            isFuture = bookingDateTime > now;
          } catch (error) {
            console.error("Errore parsing data:", error);
            return false;
          }
          
          if (!isFuture) {
            console.log(`Booking ${b._id}: non è futura`);
            return false;
          }
          
          const isMyBooking = b.isMyBooking;
          
          let isConfirmedPlayer = false;
          if (b.hasMatch && b.match && b.match.players) {
            const myPlayer = b.match.players.find((p: any) => {
              const playerUserId = p.user?._id || p.user || p.userId;
              return playerUserId === user?.id;
            });
            
            if (myPlayer) {
              isConfirmedPlayer = myPlayer.status === "confirmed";
              console.log(`  - isConfirmedPlayer: ${isConfirmedPlayer} (status: ${myPlayer.status})`);
            }
          }
          
          const shouldShow = isMyBooking || isConfirmedPlayer;
          console.log(`  - Should show: ${shouldShow} (myBooking: ${isMyBooking}, confirmed: ${isConfirmedPlayer})`);
          
          return shouldShow;
        });
        
        console.log("Prenotazioni rilevanti (mia o confermato):", relevantBookings.length);
        
        if (relevantBookings.length === 0 && bookings.length > 0) {
          console.log("=== DEBUG TUTTE LE PRENOTAZIONI ===");
          bookings.forEach((b: any, index: number) => {
            console.log(`${index + 1}. ID: ${b._id}`);
            console.log(`   Data: ${b.date} ${b.startTime}`);
            console.log(`   Status: ${b.status}`);
            console.log(`   isMyBooking: ${b.isMyBooking}`);
            console.log(`   hasMatch: ${b.hasMatch}`);
            
            if (b.hasMatch && b.match && b.match.players) {
              const myPlayer = b.match.players.find((p: any) => {
                const playerUserId = p.user?._id || p.user || p.userId;
                return playerUserId === user?.id;
              });
              console.log(`   Mio player trovato:`, myPlayer ? 'SI' : 'NO');
              if (myPlayer) {
                console.log(`   Mio status: ${myPlayer.status}`);
                console.log(`   Mio team: ${myPlayer.team}`);
              }
            }
            console.log('---');
          });
        }
        
        relevantBookings.sort((a: any, b: any) => {
          const dateA = new Date(`${a.date}T${a.startTime}:00`).getTime();
          const dateB = new Date(`${b.date}T${b.startTime}:00`).getTime();
          return dateA - dateB;
        });
        
        setNextBooking(relevantBookings[0] || null);
        
        if (relevantBookings.length > 0) {
          console.log("=== PROSSIMA PARTITA TROVATA ===");
          const next = relevantBookings[0];
          console.log("ID:", next._id);
          console.log("Data:", next.date);
          console.log("Orario:", next.startTime);
          console.log("Campo:", next.campo?.name);
          console.log("Creata da me:", next.isMyBooking);
          
          if (next.hasMatch && next.match) {
            const myPlayer = next.match.players?.find((p: any) => {
              const playerUserId = p.user?._id || p.user || p.userId;
              return playerUserId === user?.id;
            });
            console.log("Mio status nel match:", myPlayer?.status);
            console.log("Mio team nel match:", myPlayer?.team);
          }
        } else {
          console.log("=== NESSUNA PARTITA RILEVANTE TROVATA ===");
          console.log("User ID:", user?.id);
          console.log("User name:", user?.name);
        }
      }
    } catch (error) {
      console.error("Errore caricamento prossima prenotazione:", error);
    }
  };

  const loadPendingInvites = async () => {
    try {
      console.log("=== CARICAMENTO INVITI PENDENTI ===");
      
      const res = await fetch(`${API_URL}/matches/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const allMatches = await res.json();
        console.log("Tutti i match ricevuti:", allMatches.length);
        
        const pendingInvites = allMatches.filter((match: any) => {
          const myPlayer = match.players?.find((p: any) => 
            p.user?._id === user?.id
          );
          
          if (!myPlayer) {
            return false;
          }
          
          const isPendingStatus = myPlayer.status === "pending";
          const isCreator = match.createdBy?._id === user?.id;
          const isExpired = isInviteExpired(match);
          
          return isPendingStatus && !isCreator && !isExpired;
        });
        
        console.log("Inviti pendenti trovati:", pendingInvites.length);
        
        if (pendingInvites.length > 0) {
          console.log("=== DEBUG DETTAGLIATO INVITI ===");
          pendingInvites.forEach((invite: any, index: number) => {
            const myPlayer = invite.players?.find((p: any) => p.user?._id === user?.id);
            console.log(`Invito ${index + 1}:`);
            console.log(`  Match ID: ${invite._id}`);
            console.log(`  Creato da: ${invite.createdBy?.name}`);
            console.log(`  Mio status: ${myPlayer?.status}`);
            console.log(`  Data: ${invite.booking?.date}`);
            console.log(`  Orario: ${invite.booking?.startTime}`);
          });
        }
        
        setPendingInvites(pendingInvites);
      } else {
        console.error("Errore caricamento match:", res.status);
        setPendingInvites([]);
      }
    } catch (error) {
      console.error("Errore caricamento inviti:", error);
      setPendingInvites([]);
    }
  };

  const isInviteExpired = (match: any): boolean => {
    const booking = match.booking;
    if (!booking?.date || !booking?.startTime) {
      return false;
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2);
      
      const now = new Date();
      return now > cutoffTime;
    } catch (error) {
      console.error("Errore nel calcolo scadenza:", error);
      return false;
    }
  };

  const loadRecentMatchesAndStats = async () => {
    try {
      const matchesRes = await fetch(`${API_URL}/matches/me?status=completed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (matchesRes.ok) {
        const allMatches = await matchesRes.json();
        console.log("Match completati ricevuti:", allMatches.length);
        
        const matchesWithScores = allMatches.filter((m: any) => 
          m.score?.sets?.length > 0
        );
        
        console.log("Match con risultati:", matchesWithScores.length);
        
        const sortedMatches = matchesWithScores.sort((a: any, b: any) => {
          const dateA = new Date(a.playedAt || a.createdAt).getTime();
          const dateB = new Date(b.playedAt || b.createdAt).getTime();
          return dateB - dateA;
        });
        
        setRecentMatches(sortedMatches);

        const myMatches = sortedMatches.filter((m: any) => {
          const myPlayer = m.players.find((p: any) => p.user._id === user?.id);
          return myPlayer && myPlayer.status === "confirmed";
        });

        const wins = myMatches.filter((m: any) => {
          const myPlayer = m.players.find((p: any) => p.user._id === user?.id);
          return myPlayer && myPlayer.team === m.winner;
        }).length;

        setStats({
          totalMatches: myMatches.length,
          wins,
          winRate: myMatches.length > 0 ? Math.round((wins / myMatches.length) * 100) : 0,
        });
      }
    } catch (error) {
      console.error("Errore caricamento match:", error);
    }
  };

  const onRefresh = () => {
    console.log("Refresh manuale...");
    setRefreshing(true);
    loadDashboardData();
    refreshSuggestions();
  };

  const respondToInvite = async (matchId: string, response: "accept" | "decline") => {
    try {
      console.log("=== RISPOSTA INVITO ===");
      console.log("Match ID:", matchId);
      console.log("Risposta:", response);
      
      const myInvite = pendingInvites.find((inv: any) => inv._id === matchId);
      const myPlayer = myInvite?.players?.find((p: any) => p.user._id === user?.id);
      const assignedTeam = myPlayer?.team;
      
      console.log("Team assegnato:", assignedTeam);
      
      const body: any = { action: response };
      
      if (response === "accept" && assignedTeam) {
        body.team = assignedTeam;
        console.log("Includo team nella richiesta:", assignedTeam);
      }
      
      const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log("Status risposta:", res.status);
      
      if (res.ok) {
        console.log("Invito risposto con successo");
        loadDashboardData();
      } else {
        const errorData = await res.json().catch(() => ({ message: "Errore sconosciuto" }));
        console.error("Errore risposta invito:", errorData);
        alert(errorData.message || "Errore nella risposta all'invito. Riprova.");
      }
    } catch (error) {
      console.error("Errore risposta invito:", error);
      alert("Errore nella risposta all'invito. Riprova.");
    }
  };

  const handleViewInviteDetails = (invite: any) => {
    console.log("Viewing invite details:", invite);
    
    const inviteId = invite._id || invite.match?._id;
    
    if (!inviteId || typeof inviteId !== 'string') {
      console.error("ID invito non valido:", inviteId);
      return;
    }
    
    navigation.navigate("DettaglioInvito", {
      inviteId: inviteId,
      inviteData: invite,
    });
  };

  const handleViewAllInvites = () => {
    console.log("Navigating to all invites screen");
    navigation.navigate("TuttiInviti");
  };

  const handlePressFriend = (friend: any) => {
    const friendId = friend.user?._id || friend._id;
    console.log("Navigating to friend profile:", friendId);
    navigation.navigate("ProfiloUtente", {
      userId: friendId,
    });
  };

  const handleInviteFriend = (friendId: string) => {
    console.log("Inviting friend:", friendId);
    Alert.alert(
      "Invita amico",
      "Vuoi invitare questo amico a una partita?",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Invita",
          onPress: () => {
            navigation.navigate("CreaPartita", {
              selectedFriendId: friendId,
            });
          }
        }
      ]
    );
  };

  const handleAddFriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      "Aggiungi amico",
      `Vuoi inviare una richiesta di amicizia a ${friendName}?`,
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Invia richiesta",
          onPress: async () => {
            try {
              const success = await sendFriendRequest(friendId);
              if (success) {
                Alert.alert("Successo", "Richiesta di amicizia inviata!");
              }
            } catch (error) {
              Alert.alert("Errore", "Impossibile inviare la richiesta");
            }
          }
        }
      ]
    );
  };

  const validPendingInvites = getValidPendingInvites(pendingInvites || [], user?.id || "");
  
  const completedMatches = recentMatches.filter((match: any) => 
    match.status === "completed" && match.score?.sets?.length > 0
  );

  const SuggestedFriendsSection = () => {
    console.log("DEBUG: SuggestedFriendsSection render");
    //console.log("Number of suggested friends:", suggestedFriends?.length);
    //console.log("Current index:", currentFriendIndex);
    
    if (suggestionsLoading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amici suggeriti</Text>
          </View>
          <View style={styles.loadingContainerSmall}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.loadingTextSmall}>Caricamento suggerimenti...</Text>
          </View>
        </View>
      );
    }

    if (suggestionsError) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amici suggeriti</Text>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={32} color="#f44336" />
            <Text style={styles.errorText}>Errore nel caricamento</Text>
            <Pressable 
              style={styles.retryButton}
              onPress={refreshSuggestions}
            >
              <Text style={styles.retryButtonText}>Riprova</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    const handleFriendsScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      
      //console.log(`Scroll debug - Offset: ${offsetX}, ScreenWidth: ${screenWidth}, Index: ${index}`);
      
      if (index !== currentFriendIndex) {
        setCurrentFriendIndex(index);
      }
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionTitle}>Amici suggeriti</Text>
            {suggestedFriends && suggestedFriends.length > 0 && (
              <View style={styles.friendsCountBadge}>
                <Text style={styles.friendsCountText}>{suggestedFriends.length}</Text>
              </View>
            )}
          </View>
          <Pressable 
            onPress={() => navigation.navigate("CercaAmici")}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={styles.sectionLink}>Trova amici</Text>
            <Ionicons name="chevron-forward" size={16} color="#2196F3" />
          </Pressable>
        </View>
        
        {suggestedFriends && suggestedFriends.length > 0 ? (
          <>
            <FlatList
              ref={friendsCarouselRef}
              data={suggestedFriends}
              renderItem={({ item, index }) => {
                console.log(`Rendering carousel item ${index}: ${item.user?.name}`);
                return (
                  <View
                    style={{
                      width: screenWidth, // LARGHEZZA PAGINA = SCREEN WIDTH
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 16,
                    }}
                  >
                    <View style={{ width: screenWidth * 0.85 }}>
                      <SuggestedFriendCard 
                        friend={item}
                        onPress={() => handlePressFriend(item)}
                        onInvite={() => handleAddFriend(
                          item.user?._id || item._id, 
                          item.user?.name || item.name
                        )}
                      />
                    </View>
                  </View>
                );
              }}
              keyExtractor={(item) => {
                const key = item.user?._id || item._id;
                //console.log(`Key for item: ${key}`);
                return key;
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={true}
              onScroll={handleFriendsScroll}
              scrollEventThrottle={16}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              style={{ height: 180 }}
              initialScrollIndex={currentFriendIndex}
              onScrollToIndexFailed={() => {
                // Fallback se il scroll fallisce
                if (friendsCarouselRef.current) {
                  friendsCarouselRef.current.scrollToIndex({
                    index: 0,
                    animated: true,
                  });
                }
              }}
            />
            
            {/* Indicatori del carosello */}
            {suggestedFriends.length > 1 && (
              <>
                <View style={styles.carouselIndicators}>
                  {suggestedFriends.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.carouselIndicator,
                        index === currentFriendIndex ? 
                          styles.carouselIndicatorActive : 
                          styles.carouselIndicatorInactive
                      ]}
                    />
                  ))}
                </View>
                
                <Text style={styles.carouselCounter}>
                  {Math.min(currentFriendIndex + 1, suggestedFriends.length)} di {suggestedFriends.length}
                </Text>
              </>
            )}
            
            {/* Legenda priorità */}
            <View style={styles.priorityLegend}>
              <View style={styles.priorityLegendItem}>
                <View style={[styles.priorityDot, styles.priorityDotHigh]} />
                <Text style={styles.priorityLegendText}>Partite insieme</Text>
              </View>
              <View style={styles.priorityLegendItem}>
                <View style={[styles.priorityDot, styles.priorityDotMedium]} />
                <Text style={styles.priorityLegendText}>Amici in comune</Text>
              </View>
              <View style={styles.priorityLegendItem}>
                <View style={[styles.priorityDot, styles.priorityDotLow]} />
                <Text style={styles.priorityLegendText}>Stesso centro</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyCarouselContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyCarouselText}>
              Aggiungi amici per iniziare!
            </Text>
            <Text style={styles.emptyCarouselSubtext}>
              Troveremo suggerimenti basati su partite giocate insieme e interessi comuni
            </Text>
            <Pressable 
              style={[styles.bookButton, { marginTop: 16 }]}
              onPress={() => navigation.navigate("CercaAmici")}
            >
              <Text style={styles.bookButtonText}>Trova amici</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header user={user} pendingInvites={validPendingInvites} />
        
        {__DEV__ && validPendingInvites.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Inviti validi: {validPendingInvites.length}
            </Text>
          </View>
        )}

        <StatsRow stats={stats} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>La tua prossima partita</Text>
            <Pressable onPress={() => navigation.navigate("LeMiePrenotazioni")}>
              <Text style={styles.sectionLink}>Calendario</Text>
            </Pressable>
          </View>
          
          {nextBooking ? (
            <NextMatchCard
              booking={nextBooking}
              onPress={() =>
                navigation.navigate("DettaglioPrenotazione", {
                  bookingId: nextBooking._id,
                })
              }
            />
          ) : (
            <EmptyStateCard
              icon="calendar-outline"
              title="Nessuna partita in programma"
              subtitle="Prenota un campo o unisciti a una partita"
              buttonText="Prenota ora"
              onPress={() => navigation.navigate("Strutture")}
              type="booking"
            />
          )}
        </View>

        {validPendingInvites.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <InviteCardTitle 
                count={validPendingInvites.length} 
                onViewAll={handleViewAllInvites}
              />
            </View>
            
            {validPendingInvites.slice(0, 3).map((invite) => (
              <InviteCard
                key={invite._id || invite.match?._id}
                invite={invite}
                userId={user?.id}
                onViewDetails={handleViewInviteDetails}
                onRespond={respondToInvite}
              />
            ))}
            
            {validPendingInvites.length > 3 && (
              <Pressable 
                style={styles.showMoreButton}
                onPress={handleViewAllInvites}
              >
                <Text style={styles.showMoreText}>
                  Mostra altri {validPendingInvites.length - 3} inviti
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#2196F3" />
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inviti in attesa</Text>
              <Pressable onPress={handleViewAllInvites}>
                <Text style={styles.sectionLink}>Vedi tutti</Text>
              </Pressable>
            </View>
            
            <EmptyStateCard
              icon="mail-open-outline"
              title="Nessun invito in attesa"
              type="invite"
            />
          </View>
        )}

        {/* Carosello Ultime Partite */}
        {completedMatches.length > 0 ? (
          <RecentMatchesCarousel
            matches={completedMatches.slice(0, 10)}
            userId={user?.id}
            onPressMatch={(bookingId) => {
              if (bookingId) {
                navigation.navigate("DettaglioPrenotazione", {
                  bookingId,
                });
              }
            }}
            onViewAll={() => navigation.navigate("Storico")}
          />
        ) : recentMatches.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ultime Partite</Text>
              <Pressable onPress={() => navigation.navigate("Storico")}>
                <Text style={styles.sectionLink}>Storico</Text>
              </Pressable>
            </View>
            <View style={styles.noCompletedMatches}>
              <Ionicons name="clipboard-outline" size={48} color="#ccc" />
              <Text style={styles.noCompletedMatchesText}>
                Nessuna partita completata con risultato
              </Text>
            </View>
          </View>
        ) : null}

        {/* Carosello Amici Suggeriti REALI */}
        <SuggestedFriendsSection />

      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("Strutture")}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
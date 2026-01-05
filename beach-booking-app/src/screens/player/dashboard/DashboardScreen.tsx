// DashboardScreen.tsx
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import Header from "./components/Header";
import StatsRow from "./components/StatsRow";
import NextMatchCard from "./components/NextMatchCard";
import InviteCard from "./components/InviteCard";
import RecentMatchesCarousel from "./components/RecentMatchesCarousel";
import EmptyStateCard from "./components/EmptyStateCard";
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

  // Dati mock per il carosello di amici CON LOGICA DI PRIORITÀ
  const getMockSuggestedFriends = () => {
    const baseFriends = [
      {
        _id: "1",
        name: "Marco Rossi",
        avatarUrl: null,
        totalMatches: 12,
        winRate: 75,
        gamesPlayedTogether: 8,
        commonFriends: 3,
        commonFacilities: 2,
        priorityScore: 0
      },
      {
        _id: "2",
        name: "Laura Bianchi",
        avatarUrl: null,
        totalMatches: 8,
        winRate: 62,
        gamesPlayedTogether: 5,
        commonFriends: 2,
        commonFacilities: 1,
        priorityScore: 0
      },
      {
        _id: "3",
        name: "Giuseppe Verdi",
        avatarUrl: null,
        totalMatches: 15,
        winRate: 80,
        gamesPlayedTogether: 12,
        commonFriends: 4,
        commonFacilities: 3,
        priorityScore: 0
      },
      {
        _id: "4",
        name: "Anna Neri",
        avatarUrl: null,
        totalMatches: 6,
        winRate: 50,
        gamesPlayedTogether: 0,
        commonFriends: 1,
        commonFacilities: 0,
        priorityScore: 0
      },
      {
        _id: "5",
        name: "Francesco Gialli",
        avatarUrl: null,
        totalMatches: 10,
        winRate: 70,
        gamesPlayedTogether: 3,
        commonFriends: 5,
        commonFacilities: 2,
        priorityScore: 0
      },
      {
        _id: "6",
        name: "Sofia Blu",
        avatarUrl: null,
        totalMatches: 7,
        winRate: 85,
        gamesPlayedTogether: 0,
        commonFriends: 3,
        commonFacilities: 2,
        priorityScore: 0
      },
      {
        _id: "7",
        name: "Luca Marrone",
        avatarUrl: null,
        totalMatches: 9,
        winRate: 65,
        gamesPlayedTogether: 2,
        commonFriends: 0,
        commonFacilities: 3,
        priorityScore: 0
      },
      {
        _id: "8",
        name: "Paola Viola",
        avatarUrl: null,
        totalMatches: 11,
        winRate: 72,
        gamesPlayedTogether: 6,
        commonFriends: 2,
        commonFacilities: 1,
        priorityScore: 0
      }
    ];

    // Calcola il punteggio di priorità per ogni amico
    return baseFriends.map(friend => {
      let score = 0;
      
      // PRIORITÀ 1: Partite giocate insieme (peso più alto)
      if (friend.gamesPlayedTogether > 0) {
        score += friend.gamesPlayedTogether * 100;
      }
      
      // PRIORITÀ 2: Amici in comune (peso medio)
      score += friend.commonFriends * 50;
      
      // PRIORITÀ 3: Strutture preferite in comune (peso più basso)
      score += friend.commonFacilities * 20;
      
      // Bonus per win rate alto (opzionale)
      if (friend.winRate > 70) {
        score += 10;
      }
      
      return {
        ...friend,
        priorityScore: score
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6);
  };

  const mockSuggestedFriends = getMockSuggestedFriends();

  useFocusEffect(
    React.useCallback(() => {
      console.log("HomeScreen focus - caricamento dati...");
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log("=== INIZIO CARICAMENTO DASHBOARD ===");
      console.log("User ID:", user?.id);
      console.log("User name:", user?.name);

      await loadNextBooking();
      await loadPendingInvites();
      await loadRecentMatchesAndStats();

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
    console.log("Navigating to friend profile:", friend._id);
    navigation.navigate("ProfiloUtente", {
      userId: friend._id,
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

  const handleFriendsScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (screenWidth * 0.85));
    setCurrentFriendIndex(index);
  };

  const validPendingInvites = getValidPendingInvites(pendingInvites || [], user?.id || "");
  
  const completedMatches = recentMatches.filter((match: any) => 
    match.status === "completed" && match.score?.sets?.length > 0
  );

  const SuggestedFriendCard = ({ friend, onPress, onInvite }: any) => {
    const getPriorityBadge = () => {
      if (friend.gamesPlayedTogether > 0) {
        return (
          <View style={styles.priorityBadgeHigh}>
            <Ionicons name="tennisball" size={12} color="white" />
            <Text style={styles.priorityBadgeText}>
              {friend.gamesPlayedTogether} partite insieme
            </Text>
          </View>
        );
      } else if (friend.commonFriends > 0) {
        return (
          <View style={styles.priorityBadgeMedium}>
            <Ionicons name="people" size={12} color="white" />
            <Text style={styles.priorityBadgeText}>
              {friend.commonFriends} amici in comune
            </Text>
          </View>
        );
      } else if (friend.commonFacilities > 0) {
        return (
          <View style={styles.priorityBadgeLow}>
            <Ionicons name="location" size={12} color="white" />
            <Text style={styles.priorityBadgeText}>
              {friend.commonFacilities} strutture in comune
            </Text>
          </View>
        );
      }
      return null;
    };

    return (
      <Pressable 
        style={styles.suggestedFriendCard}
        onPress={() => onPress(friend)}
      >
        {friend.avatarUrl ? (
          <Image
            source={{ uri: `${API_URL}${friend.avatarUrl}` }}
            style={styles.suggestedFriendAvatar}
          />
        ) : (
          <View style={styles.suggestedFriendAvatarPlaceholder}>
            <Ionicons name="person" size={24} color="#999" />
          </View>
        )}
        
        <View style={styles.suggestedFriendInfo}>
          <View style={styles.suggestedFriendHeader}>
            <Text style={styles.suggestedFriendName} numberOfLines={1}>
              {friend.name}
            </Text>
            <Text style={styles.winRateBadge}>
              {friend.winRate}% WR
            </Text>
          </View>
          
          <Text style={styles.suggestedFriendStats}>
            {friend.totalMatches} partite totali
          </Text>
          
          {/* Badge di priorità */}
          {getPriorityBadge()}
          
          {/* Mostra tutte le metriche di priorità */}
          <View style={styles.priorityMetrics}>
            {friend.gamesPlayedTogether > 0 && (
              <View style={styles.priorityMetric}>
                <Ionicons name="tennisball-outline" size={10} color="#666" />
                <Text style={styles.priorityMetricText}>
                  {friend.gamesPlayedTogether}
                </Text>
              </View>
            )}
            {friend.commonFriends > 0 && (
              <View style={styles.priorityMetric}>
                <Ionicons name="people-outline" size={10} color="#666" />
                <Text style={styles.priorityMetricText}>
                  {friend.commonFriends}
                </Text>
              </View>
            )}
            {friend.commonFacilities > 0 && (
              <View style={styles.priorityMetric}>
                <Ionicons name="location-outline" size={10} color="#666" />
                <Text style={styles.priorityMetricText}>
                  {friend.commonFacilities}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Pressable
          style={styles.inviteFriendButton}
          onPress={(e) => {
            e.stopPropagation();
            onInvite(friend._id);
          }}
        >
          <Ionicons name="person-add-outline" size={16} color="#2196F3" />
          <Text style={styles.inviteFriendText}>Invita</Text>
        </Pressable>
      </Pressable>
    );
  };

  const SuggestedFriendsSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionTitle}>Amici suggeriti</Text>
            <View style={styles.friendsCountBadge}>
              <Text style={styles.friendsCountText}>{mockSuggestedFriends.length}</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate("CercaAmici")}>
            <Text style={styles.sectionLink}>Trova amici</Text>
          </Pressable>
        </View>
        
        {mockSuggestedFriends.length > 0 ? (
          <>
            <FlatList
              ref={friendsCarouselRef}
              data={mockSuggestedFriends}
              renderItem={({ item }) => (
                <View style={{ width: screenWidth * 0.85, marginHorizontal: 8 }}>
                  <SuggestedFriendCard
                    friend={item}
                    onPress={handlePressFriend}
                    onInvite={handleInviteFriend}
                  />
                </View>
              )}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={screenWidth * 0.85 + 16}
              snapToAlignment="start"
              contentContainerStyle={{ paddingHorizontal: 12 }}
              onScroll={handleFriendsScroll}
              scrollEventThrottle={16}
            />
            
            {/* Indicatori del carosello */}
            <View style={styles.carouselIndicators}>
              {mockSuggestedFriends.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.carouselIndicator,
                    index === currentFriendIndex ? styles.carouselIndicatorActive : styles.carouselIndicatorInactive
                  ]}
                />
              ))}
            </View>
            
            <Text style={styles.carouselCounter}>
              {currentFriendIndex + 1} di {mockSuggestedFriends.length}
            </Text>
            
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
                <Text style={styles.priorityLegendText}>Strutture in comune</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyCarouselContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyCarouselText}>
              Invita amici per giocare insieme!
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

        {/* Carosello Amici Suggeriti */}
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
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import API_URL from "../../config/api";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useUnreadMessages } from "../../context/UnreadMessagesContext";
import { useConversations } from "./useConversations";
import ConversationItem from "./ConversationItem";
import { styles } from "../../styles/ConversationScreen.styles"; // Shared styles
import { useAlert } from "../../context/AlertContext";
import MatchModal from "./MatchModal";


interface ConversationScreenProps {
  role: 'player' | 'owner';
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({ role }) => {
  const { token, user } = useContext(AuthContext);
  const { refreshUnreadCount } = useUnreadMessages();
  const navigation = useNavigation<any>();
  const enableFilters = role === 'owner';

  const { showAlert } = useAlert();

  const {
    conversations,
    loading,
    refreshing,
    onRefresh,
    formatTime,
    getUnreadCount,
    filter,
    setFilter,
    selectedStruttura,
    setSelectedStruttura,
    strutture,
    allCount,
    personalCount,
    groupCount,
  } = useConversations({ role, enableFilters });

  const [showStruttureModal, setShowStruttureModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const isOwner = role === 'owner';

  useEffect(() => {
    if (token) {
      fetchMatches();
    }
  }, [token]);

  const deleteConversation = async (conversationId: string) => {
    try {
      const endpoint = isOwner
        ? `${API_URL}/api/conversations/${conversationId}`
        : `${API_URL}/api/conversations/${conversationId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh conversation list
        onRefresh();
        refreshUnreadCount();
      } else {
        showAlert({
          type: 'error',
          title: 'Errore',
          message: 'Non è stato possibile eliminare la conversazione',
        });
      }
    } catch (error) {
      console.error("Errore nell'eliminazione della conversazione:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Si è verificato un errore durante l\'eliminazione',
      });
    }
  };

  const fetchMatches = async () => {
    console.log('fetchMatches called');
    setLoadingMatches(true);
    try {
      let endpoint = '';
      if (isOwner) {
        endpoint = `${API_URL}/matches/future-followed`;
      } else {
        endpoint = `${API_URL}/matches/me?status=open`;
      }
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('fetchMatches response status:', response.status);
      let data = await response.json();
      console.log('fetchMatches data:', data);

      if (!isOwner) {
        // Filtra partite future per giocatori
        const now = new Date();
        data = data.filter((match: any) => {
          const booking = match.booking;
          return booking && new Date(booking.date) > now;
        });
      }

      setMatches(data);
    } catch (error) {
      console.error("Errore nel caricamento delle partite:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare le partite future',
      });
    } finally {
      setLoadingMatches(false);
    }
  };

  const openGroupChat = async (match: any) => {
    try {
      console.log('🔵 [openGroupChat] Chiamata API per matchId:', match._id);
      const response = await fetch(`${API_URL}/api/conversations/match/${match._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('🗣️ [openGroupChat] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [openGroupChat] Errore API:', errorData);
        throw new Error(errorData.message || 'Errore nella creazione della conversazione');
      }
      
      const conversation = await response.json();
      console.log('🗣️ [openGroupChat] Risposta API completa:', JSON.stringify(conversation, null, 2));
      console.log('🗣️ [openGroupChat] conversation._id:', conversation._id);
      
      if (!conversation._id) {
        console.error('❌ [openGroupChat] La conversazione non ha un _id!');
        throw new Error('Conversazione non valida');
      }
      
      console.log('🗣️ [openGroupChat] Dati passati a GroupChat:', {
        conversationId: conversation._id,
        match: match,
        conversation: conversation
      });
      
      navigation.navigate("GroupChat", { conversationId: conversation._id, match });
      setShowMatchModal(false);
    } catch (error) {
      console.error("❌ [openGroupChat] Errore nell'apertura della chat di gruppo:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: error instanceof Error ? error.message : 'Impossibile aprire la chat di gruppo',
      });
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <ConversationItem
      conversation={item}
      role={role}
      formatTime={formatTime}
      getUnreadCount={getUnreadCount}
      refreshUnreadCount={refreshUnreadCount}
      onDelete={deleteConversation}
    />
  );

  if (!token || (isOwner && user?.role !== 'owner')) {
    return (
      <>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {isOwner ? "Accesso negato" : "Accedi per vedere le chat"}
            </Text>
            <Text style={styles.emptyText}>
              {isOwner
                ? "Questa sezione è riservata ai proprietari"
                : "Effettua il login per chattare con le strutture"}
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2979ff" />
            {isOwner && <Text style={styles.loadingText}>Caricamento chat...</Text>}
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, role === 'player' && styles.headerWithBack]}>
          {role === 'player' && (
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </Pressable>
          )}
          <Text style={[styles.headerTitle, role === 'player' && styles.headerTitleWithBack]}>Messaggi</Text>

        {enableFilters && (
          <>
            <View style={styles.filterContainer}>
              <Pressable
                style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
                onPress={() => setFilter("all")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === "all" && styles.filterButtonTextActive,
                  ]}
                >
                  Tutte ({allCount})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  filter === "personal" && styles.filterButtonActive,
                ]}
                onPress={() => setFilter("personal")}
              >
                <View style={styles.filterButtonContent}>
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={filter === "personal" ? "white" : "#666"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === "personal" && styles.filterButtonTextActive,
                    ]}
                  >
                    Personali ({personalCount})
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.filterButton,
                  filter === "group" && styles.filterButtonActive,
                ]}
                onPress={() => setFilter("group")}
              >
                <View style={styles.filterButtonContent}>
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={filter === "group" ? "white" : "#666"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === "group" && styles.filterButtonTextActive,
                    ]}
                  >
                    Gruppi ({groupCount})
                  </Text>
                </View>
              </Pressable>
            </View>

            {strutture.length > 0 && (
              <View style={styles.struttureFilterContainer}>
                <Pressable
                  style={styles.strutturaChipSelector}
                  onPress={() => setShowStruttureModal(true)}
                >
                  <View style={styles.strutturaChipContent}>
                    <Ionicons
                      name={selectedStruttura ? "business" : "grid-outline"}
                      size={16}
                      color="#4CAF50"
                    />
                    <Text style={styles.strutturaChipSelectorText} numberOfLines={1}>
                      {selectedStruttura
                        ? strutture.find(s => s.id === selectedStruttura)?.name || "Tutte le strutture"
                        : "Tutte le strutture"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#666" />
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={
              enableFilters
                ? filter === "group"
                  ? "people-outline"
                  : filter === "personal"
                  ? "person-outline"
                  : "chatbubbles-outline"
                : "chatbubbles-outline"
            }
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyTitle}>
            {enableFilters
              ? filter === "personal"
                ? "Nessuna chat personale"
                : filter === "group"
                ? "Nessuna chat di gruppo"
                : "Nessuna conversazione"
              : "Nessuna conversazione"}
          </Text>
          <Text style={styles.emptyText}>
            {enableFilters
              ? filter === "personal"
                ? "Quando i clienti ti contatteranno, le chat appariranno qui"
                : filter === "group"
                ? "Le chat di gruppo dei match appariranno qui"
                : "Quando i clienti ti contatteranno o verranno creati match, le chat appariranno qui"
              : "Contatta una struttura per iniziare una chat!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2979ff"]}
              tintColor="#2979ff"
            />
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => {
          console.log('FAB pressed, opening modal');
          setShowMatchModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="white" />
      </Pressable>

      {enableFilters && (
        <Modal
          visible={showStruttureModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowStruttureModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowStruttureModal(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleziona struttura</Text>
                <Pressable onPress={() => setShowStruttureModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#333" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalList}>
                <Pressable
                  style={[
                    styles.modalItem,
                    !selectedStruttura && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedStruttura(null);
                    setShowStruttureModal(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <View style={[
                      styles.modalItemIcon,
                      !selectedStruttura && styles.modalItemIconActive,
                    ]}>
                      <Ionicons
                        name="grid"
                        size={20}
                        color={!selectedStruttura ? "white" : "#4CAF50"}
                      />
                    </View>
                    <Text style={[
                      styles.modalItemText,
                      !selectedStruttura && styles.modalItemTextActive,
                    ]}>
                      Tutte le strutture
                    </Text>
                  </View>
                  {!selectedStruttura && (
                    <Ionicons name="checkmark" size={24} color="#4CAF50" />
                  )}
                </Pressable>

                {strutture.map((struttura) => {
                  const isActive = selectedStruttura === struttura.id;
                  const count = conversations.filter(
                    (c) => c.struttura?._id === struttura.id
                  ).length;

                  return (
                    <Pressable
                      key={struttura.id}
                      style={[
                        styles.modalItem,
                        isActive && styles.modalItemActive,
                      ]}
                      onPress={() => {
                        setSelectedStruttura(struttura.id);
                        setShowStruttureModal(false);
                      }}
                    >
                      <View style={styles.modalItemLeft}>
                        <View style={[
                          styles.modalItemIcon,
                          isActive && styles.modalItemIconActive,
                        ]}>
                          <Ionicons
                            name="business"
                            size={20}
                            color={isActive ? "white" : "#4CAF50"}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.modalItemText,
                            isActive && styles.modalItemTextActive,
                          ]} numberOfLines={1}>
                            {struttura.name}
                          </Text>
                          {count > 0 && (
                            <Text style={styles.modalItemSubtext}>
                              {count} {count === 1 ? 'conversazione' : 'conversazioni'}
                            </Text>
                          )}
                        </View>
                      </View>
                      {isActive && (
                        <Ionicons name="checkmark" size={24} color="#4CAF50" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <MatchModal
        visible={showMatchModal}
        onRequestClose={() => setShowMatchModal(false)}
        matches={matches}
        loading={loadingMatches}
        onSelectMatch={openGroupChat}
        emptyText={
          isOwner
            ? "Non ci sono partite future nelle strutture che gestisci"
            : "Non ci sono partite future a cui partecipi"
        }
      />

    </SafeAreaView>
    </>
  );
};

export default ConversationScreen;
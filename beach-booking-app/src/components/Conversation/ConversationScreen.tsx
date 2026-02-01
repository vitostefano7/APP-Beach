import React, { useState } from "react";
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
import { API_URL } from "../../config/api";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useUnreadMessages } from "../../context/UnreadMessagesContext";
import { useConversations } from "./useConversations";
import ConversationItem from "./ConversationItem";
import { styles } from "../../styles/ConversationScreen.styles"; // Shared styles
import { useCustomAlert } from "../CustomAlert/CustomAlert";


interface ConversationScreenProps {
  role: 'player' | 'owner';
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({ role }) => {
  const { token, user } = useContext(AuthContext);
  const { refreshUnreadCount } = useUnreadMessages();
  const enableFilters = role === 'owner';

  const { showAlert, AlertComponent } = useCustomAlert();

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

  const isOwner = role === 'owner';

  const deleteConversation = async (conversationId: string) => {
    try {
      const endpoint = isOwner
        ? `${API_URL}/owner/conversazioni/${conversationId}`
        : `${API_URL}/conversazioni/${conversationId}`;

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
        <AlertComponent />
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
        <AlertComponent />
      </>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messaggi</Text>

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
    </SafeAreaView>
    <AlertComponent />
    </>
  );
};

export default ConversationScreen;
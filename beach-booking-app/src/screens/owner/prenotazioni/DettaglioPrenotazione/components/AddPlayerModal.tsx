import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../styles/DettaglioPrenotazioneOwnerScreen.styles";
import { Avatar } from "../../../../../components/Avatar";

interface User {
  _id: string;
  name: string;
  surname: string;
  username: string;
  avatarUrl?: string;
}

interface AddPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPlayer: (userId: string, team: "A" | "B") => Promise<void>;
  token: string;
  apiUrl: string;
  initialTeam?: "A" | "B";
  teamACount?: number;
  teamBCount?: number;
  maxPlayersPerTeam?: number;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  visible,
  onClose,
  onAddPlayer,
  token,
  apiUrl,
  initialTeam = "A",
  teamACount = 0,
  teamBCount = 0,
  maxPlayersPerTeam = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">(initialTeam);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Aggiorna il team selezionato quando cambia initialTeam
  useEffect(() => {
    if (visible) {
      setSelectedTeam(initialTeam);
      setSearchQuery("");
      setResults([]);
    }
  }, [visible, initialTeam]);

  // Ricerca automatica con debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500); // Attendi 500ms dopo che l'utente smette di scrivere
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `${apiUrl}/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Errore ricerca utenti:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddUser = async (user: User) => {
    try {
      await onAddPlayer(user._id, selectedTeam);
      setSearchQuery("");
      setResults([]);
      onClose();
      Alert.alert("Successo", `${user.name} aggiunto al Team ${selectedTeam}`);
    } catch (error) {
      Alert.alert("Errore", "Impossibile aggiungere il giocatore");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Aggiungi Giocatore</Text>
            <Pressable onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Team Selector */}
          <View style={modalStyles.teamSelector}>
            <Text style={modalStyles.label}>Seleziona Team:</Text>
            <View style={modalStyles.teamButtons}>
              <Pressable
                style={[
                  modalStyles.teamButton,
                  modalStyles.teamAButton,
                  selectedTeam === "A" && modalStyles.teamButtonActive,
                ]}
                onPress={() => setSelectedTeam("A")}
              >
                <Text
                  style={[
                    modalStyles.teamButtonText,
                    selectedTeam === "A" && modalStyles.teamButtonTextActive,
                  ]}
                >
                  Team A
                </Text>
                {maxPlayersPerTeam > 0 && (
                  <Text style={modalStyles.teamCountText}>
                    {teamACount}/{maxPlayersPerTeam}
                  </Text>
                )}
              </Pressable>
              <Pressable
                style={[
                  modalStyles.teamButton,
                  modalStyles.teamBButton,
                  selectedTeam === "B" && modalStyles.teamButtonActive,
                ]}
                onPress={() => setSelectedTeam("B")}
              >
                <Text
                  style={[
                    modalStyles.teamButtonText,
                    selectedTeam === "B" && modalStyles.teamButtonTextActive,
                  ]}
                >
                  Team B
                </Text>
                {maxPlayersPerTeam > 0 && (
                  <Text style={modalStyles.teamCountText}>
                    {teamBCount}/{maxPlayersPerTeam}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Search Input */}
          <View style={modalStyles.searchBox}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={modalStyles.searchInput}
              placeholder="Cerca per nome, cognome, username o email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && (
              <ActivityIndicator size="small" color="#2196F3" style={{ marginLeft: 8 }} />
            )}
          </View>

          {/* Results */}
          <ScrollView style={modalStyles.searchResults}>
            {searching ? (
              <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 20 }} />
            ) : results.length === 0 && searchQuery.length >= 2 ? (
              <Text style={modalStyles.noResults}>Nessun utente trovato</Text>
            ) : searchQuery.length < 2 ? (
              <Text style={modalStyles.noResults}>Inserisci almeno 2 caratteri per cercare</Text>
            ) : (
              results.map((item, index) => (
                <Pressable
                  key={item._id}
                  style={modalStyles.searchResultItem}
                  onPress={() => handleAddUser(item)}
                >
                  <Avatar
                    avatarUrl={item.avatarUrl}
                    name={item.name}
                    surname={item.surname}
                    size={44}
                  />
                  <View style={modalStyles.resultInfo}>
                    <Text style={modalStyles.resultName}>
                      {item.name} {item.surname}
                    </Text>
                    <Text style={modalStyles.resultUsername}>@{item.username}</Text>
                  </View>
                  <Ionicons 
                    name="add-circle" 
                    size={24} 
                    color={selectedTeam === "A" ? "#2196F3" : "#F44336"} 
                  />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end" as const,
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
  },
  teamSelector: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#666",
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  teamButtons: {
    flexDirection: "row" as const,
    gap: 12,
  },
  teamButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center" as const,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  teamAButton: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  teamBButton: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  teamButtonActive: {
    borderWidth: 3,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  teamButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  teamButtonTextActive: {
    fontWeight: "900" as const,
    fontSize: 16,
  },
  teamCountText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#666",
    marginTop: 6,
    opacity: 0.8,
  },
  searchBox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500" as const,
  },
  searchResults: {
    maxHeight: 420,
  },
  noResults: {
    textAlign: "center" as const,
    color: "#999",
    fontSize: 15,
    marginTop: 40,
    fontWeight: "500" as const,
  },
  searchResultItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "white",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 14,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  resultUsername: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
    fontWeight: "500" as const,
  },
};

export default AddPlayerModal;

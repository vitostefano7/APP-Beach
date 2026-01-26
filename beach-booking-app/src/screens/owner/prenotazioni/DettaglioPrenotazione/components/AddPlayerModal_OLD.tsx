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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    padding: 20,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  teamSelector: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#666",
    marginBottom: 10,
  },
  teamButtons: {
    flexDirection: "row" as const,
    gap: 10,
  },
  teamButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center" as const,
    borderWidth: 2,
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
  },
  teamButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  teamButtonTextActive: {
    fontWeight: "800" as const,
  },
  teamCountText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#666",
    marginTop: 4,
  },
  searchBox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  searchResults: {
    maxHeight: 400,
  },
  noResults: {
    textAlign: "center" as const,
    color: "#999",
    fontSize: 14,
    marginTop: 20,
  },
  searchResultItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  resultUsername: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
};

export default AddPlayerModal;

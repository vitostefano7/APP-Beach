import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../styles/DettaglioPrenotazioneOwnerScreen.styles";

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
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  visible,
  onClose,
  onAddPlayer,
  token,
  apiUrl,
  initialTeam = "A",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">(initialTeam);

  // Aggiorna il team selezionato quando cambia initialTeam
  React.useEffect(() => {
    if (visible) {
      setSelectedTeam(initialTeam);
      setSearchQuery("");
      setResults([]);
    }
  }, [visible, initialTeam]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Attenzione", "Inserisci un nome utente o email");
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(
        `${apiUrl}/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResults(data);
    } catch (error) {
      Alert.alert("Errore", "Impossibile cercare utenti");
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

  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
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
              </Pressable>
            </View>
          </View>

          {/* Search Input */}
          <View style={modalStyles.searchContainer}>
            <TextInput
              style={modalStyles.searchInput}
              placeholder="Cerca per username o email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
            />
            <Pressable
              style={modalStyles.searchButton}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="search" size={20} color="white" />
              )}
            </Pressable>
          </View>

          {/* Results */}
          {results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item._id}
              style={modalStyles.resultsList}
              renderItem={({ item }) => (
                <Pressable
                  style={modalStyles.userCard}
                  onPress={() => handleAddUser(item)}
                >
                  <View
                    style={[
                      modalStyles.avatar,
                      {
                        backgroundColor:
                          selectedTeam === "A" ? "#2196F3" : "#F44336",
                      },
                    ]}
                  >
                    <Text style={modalStyles.avatarText}>
                      {getInitials(item.name, item.surname)}
                    </Text>
                  </View>
                  <View style={modalStyles.userInfo}>
                    <Text style={modalStyles.userName}>
                      {item.name} {item.surname}
                    </Text>
                    <Text style={modalStyles.userUsername}>@{item.username}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#4CAF50" />
                </Pressable>
              )}
            />
          ) : (
            <View style={modalStyles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={modalStyles.emptyText}>
                {searchQuery
                  ? "Nessun utente trovato"
                  : "Cerca un utente per aggiungerlo al match"}
              </Text>
            </View>
          )}
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
  searchContainer: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: "#2196F3",
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  resultsList: {
    maxHeight: 400,
  },
  userCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800" as const,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  userUsername: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
    textAlign: "center" as const,
  },
};

export default AddPlayerModal;

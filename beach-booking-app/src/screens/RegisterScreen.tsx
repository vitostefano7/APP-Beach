import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

type Step = 1 | 2 | 3;

export default function RegisterScreen({ navigation }: any) {
  // Step 1: Credenziali
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Ruolo
  const [role, setRole] = useState<"player" | "owner">("player");

  // Step 3: Preferenze (solo per player)
  const [city, setCity] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const sports = ["Beach Volley", "Volley"];

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const nextStep = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      if (currentStep === 1) setCurrentStep(2);
    }, 200);
  };

  const prevStep = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      if (currentStep === 2) setCurrentStep(1);
    }, 200);
  };

  const handleRegister = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://192.168.1.138:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Errore durante la registrazione");
        return;
      }

      console.log("Risposta registrazione:", data); // Debug

      // Se è un player, vai alle preferenze
      if (role === "player") {
        // L'API potrebbe restituire direttamente il token oppure dentro data.token
        const token = data.token || data.accessToken || null;
        
        navigation.navigate("SetupPreferences", {
          userId: data._id || data.id || data.userId || email, // Fallback su email se non c'è ID
          token: token,
          name,
        });
      } else {
        // Owner va direttamente al login
        alert("Registrazione completata! Ora puoi effettuare il login.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Errore registrazione:", error);
      alert("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return name.trim() && email.trim() && password.length >= 6;
    }
    if (currentStep === 2) {
      return role !== null;
    }
    return true; // Step 3 è opzionale
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Registrazione</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: currentStep === 1 ? "50%" : "100%",
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Step {currentStep} di 2</Text>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* STEP 1: Credenziali */}
            {currentStep === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="person-add" size={32} color="#2979ff" />
                  </View>
                </View>

                <Text style={styles.stepTitle}>Crea il tuo account</Text>
                <Text style={styles.stepSubtitle}>
                  Inserisci i tuoi dati per iniziare
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome completo</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Mario Rossi"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="mario@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Minimo 6 caratteri"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                  {password.length > 0 && password.length < 6 && (
                    <Text style={styles.errorText}>Minimo 6 caratteri</Text>
                  )}
                </View>
              </View>
            )}

            {/* STEP 2: Ruolo */}
            {currentStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="people" size={32} color="#2979ff" />
                  </View>
                </View>

                <Text style={styles.stepTitle}>Scegli il tuo ruolo</Text>
                <Text style={styles.stepSubtitle}>
                  Cosa vorresti fare sulla piattaforma?
                </Text>

                <View style={styles.roleContainer}>
                  <Pressable
                    style={[
                      styles.roleCard,
                      role === "player" && styles.roleCardActive,
                    ]}
                    onPress={() => setRole("player")}
                  >
                    <View
                      style={[
                        styles.roleIconBox,
                        role === "player" && styles.roleIconBoxActive,
                      ]}
                    >
                      <Ionicons
                        name="tennisball"
                        size={40}
                        color={role === "player" ? "#2979ff" : "#666"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.roleTitle,
                        role === "player" && styles.roleTitleActive,
                      ]}
                    >
                      Giocatore
                    </Text>
                    <Text style={styles.roleDescription}>
                      Prenota campi e trova partite
                    </Text>
                    {role === "player" && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </Pressable>

                  <Pressable
                    style={[
                      styles.roleCard,
                      role === "owner" && styles.roleCardActive,
                    ]}
                    onPress={() => setRole("owner")}
                  >
                    <View
                      style={[
                        styles.roleIconBox,
                        role === "owner" && styles.roleIconBoxActive,
                      ]}
                    >
                      <Ionicons
                        name="business"
                        size={40}
                        color={role === "owner" ? "#2979ff" : "#666"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.roleTitle,
                        role === "owner" && styles.roleTitleActive,
                      ]}
                    >
                      Gestore
                    </Text>
                    <Text style={styles.roleDescription}>
                      Gestisci strutture e campi
                    </Text>
                    {role === "owner" && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

          </Animated.View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <Pressable style={styles.backBtn} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color="#666" />
              <Text style={styles.backBtnText}>Indietro</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.nextBtn,
              !canProceed() && styles.nextBtnDisabled,
              currentStep === 1 && { flex: 1 },
            ]}
            onPress={currentStep === 2 ? handleRegister : nextStep}
            disabled={!canProceed() || loading}
          >
            <Text style={styles.nextBtnText}>
              {loading
                ? "Caricamento..."
                : currentStep === 2
                ? "Completa registrazione"
                : "Continua"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "white",
  },

  progressBar: {
    height: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2979ff",
    borderRadius: 3,
  },

  progressText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
  },

  stepContainer: {
    marginBottom: 20,
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },

  stepSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  optional: {
    color: "#999",
    fontWeight: "500",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },

  errorText: {
    fontSize: 13,
    color: "#FF5252",
    marginTop: 6,
    fontWeight: "500",
  },

  roleContainer: {
    gap: 16,
  },

  roleCard: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    position: "relative",
  },

  roleCardActive: {
    borderColor: "#2979ff",
    backgroundColor: "#F0F7FF",
  },

  roleIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  roleIconBoxActive: {
    backgroundColor: "#E3F2FD",
  },

  roleTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 6,
  },

  roleTitleActive: {
    color: "#2979ff",
  },

  roleDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  checkBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2979ff",
    alignItems: "center",
    justifyContent: "center",
  },

  sportsGrid: {
    gap: 12,
  },

  sportChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  sportChipActive: {
    borderColor: "#2979ff",
    backgroundColor: "#F0F7FF",
  },

  sportText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },

  sportTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  skipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF9E6",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },

  skipText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },

  backBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#666",
  },

  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#2979ff",
  },

  nextBtnDisabled: {
    backgroundColor: "#ccc",
  },

  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
});
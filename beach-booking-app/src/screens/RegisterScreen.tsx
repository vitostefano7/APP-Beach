import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../context/AuthContext";
import API_URL from "../config/api";

export default function RegisterScreen({ navigation }: any) {
  const { login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"player" | "owner">("player");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Refs per gestire il focus
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // ✅ Funzione per selezionare immagine
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permesso negato",
          "Devi concedere il permesso per accedere alle foto"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore selezione immagine:", error);
      Alert.alert("Errore", "Impossibile selezionare l'immagine");
    }
  };

  // ✅ Funzione per scattare foto
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permesso negato",
          "Devi concedere il permesso per usare la fotocamera"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore fotocamera:", error);
      Alert.alert("Errore", "Impossibile scattare la foto");
    }
  };

  // ✅ Mostra opzioni per scegliere immagine
  const selectAvatar = () => {
    if (avatarUri) {
      // Se c'è già un'immagine selezionata, mostra anche "Rimuovi foto"
      Alert.alert(
        "Scegli immagine profilo",
        "Come vuoi caricare la tua foto?",
        [
          { text: "Annulla", onPress: () => {}, style: "cancel" as const },
          { text: "Galleria", onPress: pickImage },
          { text: "Fotocamera", onPress: takePhoto },
          { 
            text: "Rimuovi foto", 
            onPress: () => setAvatarUri(null),
            style: "destructive" as const
          },
        ],
        { cancelable: true }
      );
    } else {
      // Se non c'è immagine, solo galleria e fotocamera
      Alert.alert(
        "Scegli immagine profilo",
        "Come vuoi caricare la tua foto?",
        [
          { text: "Annulla", onPress: () => {}, style: "cancel" as const },
          { text: "Galleria", onPress: pickImage },
          { text: "Fotocamera", onPress: takePhoto },
        ],
        { cancelable: true }
      );
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Errore", "Compila tutti i campi obbligatori");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Errore", "Le password non coincidono");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Errore", "La password deve essere almeno 8 caratteri");
      return;
    }

    setLoading(true);

    try {
      // ✅ Usa FormData per inviare anche l'immagine
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email.toLowerCase().trim());
      formData.append("password", password);
      formData.append("role", role);

      // ✅ Aggiungi avatar se selezionato
      if (avatarUri) {
        const filename = avatarUri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("avatar", {
          uri: avatarUri,
          name: filename,
          type,
        } as any);
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: formData,
        headers: {
          // ⚠️ NON settare Content-Type - FormData lo fa automaticamente
        },
      });

      const data = await res.json();
      
      console.log("📥 Risposta registrazione:", data);
      console.log("🖼️ Avatar nella risposta:", data.avatarUrl);

      if (!res.ok) {
        Alert.alert("Errore registrazione", data.message || "Riprova");
        return;
      }

      // ✅ Naviga alla schermata di setup preferenze
      navigation.navigate("SetupPreferences", {
        userId: data.id,
        token: data.token,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarUrl: data.avatarUrl,
      });

    } catch (error) {
      console.error("Register error:", error);
      Alert.alert("Errore", "Impossibile registrarsi. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={150}
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableResetScrollToCoords={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Crea il tuo account</Text>
          <Text style={styles.subtitle}>
            Inizia a prenotare i tuoi campi preferiti
          </Text>

          {/* ✅ AVATAR PICKER */}
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarButton} onPress={selectAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera" size={32} color="#999" />
                  <Text style={styles.avatarText}>Aggiungi foto</Text>
                </View>
              )}
            </Pressable>
            {avatarUri && (
              <Pressable
                style={styles.removeAvatar}
                onPress={() => setAvatarUri(null)}
              >
                <Ionicons name="close-circle" size={28} color="#F44336" />
              </Pressable>
            )}
          </View>

          {/* ROLE SELECTOR */}
          <View style={styles.roleContainer}>
            <Pressable
              style={[styles.roleButton, role === "player" && styles.roleActive]}
              onPress={() => setRole("player")}
            >
              <Ionicons
                name="tennisball"
                size={24}
                color={role === "player" ? "#fff" : "#666"}
              />
              <Text
                style={[styles.roleText, role === "player" && styles.roleTextActive]}
              >
                Giocatore
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleButton, role === "owner" && styles.roleActive]}
              onPress={() => setRole("owner")}
            >
              <Ionicons
                name="business"
                size={24}
                color={role === "owner" ? "#fff" : "#666"}
              />
              <Text
                style={[styles.roleText, role === "owner" && styles.roleTextActive]}
              >
                Proprietario
              </Text>
            </Pressable>
          </View>

          {/* FORM FIELDS */}
          <Text style={styles.label}>Nome completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mario Rossi"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            ref={emailRef}
            style={styles.input}
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="Almeno 8 caratteri"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          />

          <Text style={styles.label}>Conferma password *</Text>
          <TextInput
            ref={confirmPasswordRef}
            style={styles.input}
            placeholder="Ripeti la password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <Pressable
            style={[styles.registerButton, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerButtonText}>Registrati</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLinkText}>
              Hai già un account? <Text style={styles.loginLinkBold}>Accedi</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    paddingTop: 60, // Spazio extra in alto
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  avatarSection: {
    alignItems: "center" as const,
    marginBottom: 30,
    position: "relative" as const,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden" as const,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  avatarText: {
    marginTop: 8,
    fontSize: 12,
    color: "#999",
  },
  removeAvatar: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 14,
  },
  roleContainer: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  roleActive: {
    backgroundColor: "#ef8f00",
    borderColor: "#ef8f00",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#666",
  },
  roleTextActive: {
    color: "#fff",
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  registerButton: {
    backgroundColor: "#ef8f00",
    padding: 16,
    borderRadius: 12,
    alignItems: "center" as const,
    marginTop: 10,
  },
  registerButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center" as const,
  },
  loginLinkText: {
    fontSize: 15,
    color: "#666",
  },
  loginLinkBold: {
    color: "#ef8f00",
    fontWeight: "700" as const,
  },
};

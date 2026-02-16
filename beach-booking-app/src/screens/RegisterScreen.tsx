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
import { useCustomAlert } from "../hooks/useCustomAlert";

export default function RegisterScreen({ navigation }: any) {
  const { login } = useContext(AuthContext);
  const { showAlert, AlertComponent } = useCustomAlert();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"player" | "owner">("player");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Stati per validazione real-time
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable" | "invalid">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  
  // Timeout separati per debounce
  const usernameDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const emailDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Refs per gestire il focus
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // ✅ Funzione per controllare disponibilità username
  const checkUsernameAvailability = async (value: string) => {
    console.log("🔍 [Username Check] Inizio controllo:", value);
    
    if (!value) {
      console.log("⚪ [Username Check] Campo vuoto, stato: idle");
      setUsernameStatus("idle");
      return;
    }

    // Validazione formato locale
    if (value.length < 10 || value.length > 20) {
      console.log("⚠️ [Username Check] Lunghezza non valida:", value.length);
      setUsernameStatus("invalid");
      return;
    }

    if (!/^[a-z0-9_]+$/i.test(value)) {
      console.log("⚠️ [Username Check] Formato non valido:", value);
      setUsernameStatus("invalid");
      return;
    }

    // Check remoto
    console.log("🔄 [Username Check] Chiamata API in corso...");
    setUsernameStatus("checking");
    try {
      const res = await fetch(
        `${API_URL}/auth/check-availability?username=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      console.log("📥 [Username Check] Risposta API:", data);
      const newStatus = data.usernameAvailable ? "available" : "unavailable";
      console.log(`${data.usernameAvailable ? '✅' : '❌'} [Username Check] Stato finale:`, newStatus);
      setUsernameStatus(newStatus);
    } catch (error) {
      console.error("❌ [Username Check] Errore:", error);
      setUsernameStatus("idle");
    }
  };

  // ✅ Funzione per controllare disponibilità email
  const checkEmailAvailability = async (value: string) => {
    console.log("📧 [Email Check] Inizio controllo:", value);
    
    if (!value) {
      console.log("⚪ [Email Check] Campo vuoto, stato: idle");
      setEmailStatus("idle");
      return;
    }

    // Validazione formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      console.log("⚠️ [Email Check] Formato email non valido:", value);
      setEmailStatus("idle");
      return;
    }

    // Check remoto
    console.log("🔄 [Email Check] Chiamata API in corso...");
    setEmailStatus("checking");
    try {
      const res = await fetch(
        `${API_URL}/auth/check-availability?email=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      console.log("📥 [Email Check] Risposta API:", data);
      const newStatus = data.emailAvailable ? "available" : "unavailable";
      console.log(`${data.emailAvailable ? '✅' : '❌'} [Email Check] Stato finale:`, newStatus);
      setEmailStatus(newStatus);
    } catch (error) {
      console.error("❌ [Email Check] Errore:", error);
      setEmailStatus("idle");
    }
  };

  // ✅ Debounced check username
  React.useEffect(() => {
    console.log("⏱️ [Username Debounce] Trigger - valore:", username);
    
    if (usernameDebounceTimeout.current) {
      clearTimeout(usernameDebounceTimeout.current);
      console.log("🔄 [Username Debounce] Timeout precedente cancellato");
    }

    usernameDebounceTimeout.current = setTimeout(() => {
      console.log("✅ [Username Debounce] 800ms passati, avvio check");
      checkUsernameAvailability(username);
    }, 800);

    return () => {
      if (usernameDebounceTimeout.current) {
        clearTimeout(usernameDebounceTimeout.current);
      }
    };
  }, [username]);

  // ✅ Debounced check email
  React.useEffect(() => {
    console.log("⏱️ [Email Debounce] Trigger - valore:", email);
    
    if (emailDebounceTimeout.current) {
      clearTimeout(emailDebounceTimeout.current);
      console.log("🔄 [Email Debounce] Timeout precedente cancellato");
    }

    emailDebounceTimeout.current = setTimeout(() => {
      console.log("✅ [Email Debounce] 800ms passati, avvio check");
      checkEmailAvailability(email);
    }, 800);

    return () => {
      if (emailDebounceTimeout.current) {
        clearTimeout(emailDebounceTimeout.current);
      }
    };
  }, [email]);

  // ✅ Funzione per selezionare immagine
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showAlert({
          type: 'error',
          title: 'Permesso negato',
          message: 'Devi concedere il permesso per accedere alle foto'
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore selezione immagine:", error);
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile selezionare l\'immagine' });
    }
  };

  // ✅ Funzione per scattare foto
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        showAlert({
          type: 'error',
          title: 'Permesso negato',
          message: 'Devi concedere il permesso per usare la fotocamera'
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore fotocamera:", error);
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile scattare la foto' });
    }
  };

  // ✅ Mostra opzioni per scegliere immagine
  const selectAvatar = () => {
    if (avatarUri) {
      // Se c'è già un'immagine selezionata, mostra anche "Rimuovi foto"
      showAlert({
        type: 'info',
        title: 'Scegli immagine profilo',
        message: 'Come vuoi caricare la tua foto?',
        buttons: [
          { text: "Annulla", onPress: () => {}, style: "cancel" },
          { text: "Galleria", onPress: pickImage },
          { text: "Fotocamera", onPress: takePhoto },
          {
            text: "Rimuovi foto",
            onPress: () => setAvatarUri(null),
            style: "destructive"
          }
        ]
      });
    } else {
      // Se non c'è immagine, solo galleria e fotocamera
      showAlert({
        type: 'info',
        title: 'Scegli immagine profilo',
        message: 'Come vuoi caricare la tua foto?',
        buttons: [
          { text: "Annulla", onPress: () => {}, style: "cancel" },
          { text: "Galleria", onPress: pickImage },
          { text: "Fotocamera", onPress: takePhoto }
        ]
      });
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !email || !password) {
      showAlert({ type: 'error', title: 'Errore', message: 'Compila tutti i campi obbligatori' });
      return;
    }

    if (usernameStatus === "invalid") {
      showAlert({ type: 'error', title: 'Errore', message: 'Lo username deve essere tra 10 e 20 caratteri e contenere solo lettere, numeri e underscore' });
      return;
    }

    if (usernameStatus === "unavailable") {
      showAlert({ type: 'error', title: 'Errore', message: 'Username già in uso' });
      return;
    }

    if (emailStatus === "unavailable") {
      showAlert({ type: 'error', title: 'Errore', message: 'Email già registrata' });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({ type: 'error', title: 'Errore', message: 'Le password non coincidono' });
      return;
    }

    if (password.length < 8) {
      showAlert({ type: 'error', title: 'Errore', message: 'La password deve essere almeno 8 caratteri' });
      return;
    }

    setLoading(true);

    try {
      // ✅ Usa FormData per inviare anche l'immagine
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username.toLowerCase().trim());
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
        showAlert({ type: 'error', title: 'Errore registrazione', message: data.message || "Riprova" });
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
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile registrarsi. Riprova più tardi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Crea il tuo account</Text>
          <Text style={styles.headerSubtitle}>Inizia a prenotare i tuoi campi preferiti</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

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
        <View style={[styles.content, { paddingTop: 20 }]}>

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
            onSubmitEditing={() => usernameRef.current?.focus()}
          />

          <Text style={styles.label}>Username *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={usernameRef}
              style={[styles.input, styles.inputWithIcon]}
              placeholder="mario_rossi"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            {usernameStatus === "checking" && (
              <ActivityIndicator size="small" color="#999" style={styles.inputIcon} />
            )}
            {usernameStatus === "available" && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.inputIcon} />
            )}
            {usernameStatus === "unavailable" && (
              <Ionicons name="close-circle" size={24} color="#F44336" style={styles.inputIcon} />
            )}
            {usernameStatus === "invalid" && (
              <Ionicons name="alert-circle" size={24} color="#FF9800" style={styles.inputIcon} />
            )}
          </View>
          {usernameStatus === "unavailable" && (
            <Text style={styles.errorText}>Username già in uso</Text>
          )}
          {usernameStatus === "invalid" && (
            <Text style={styles.errorText}>Formato non valido (10-20 caratteri: lettere, numeri, _)</Text>
          )}
          {usernameStatus === "available" && (
            <Text style={styles.successText}>Username disponibile ✓</Text>
          )}

          <Text style={styles.label}>Email *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={emailRef}
              style={[styles.input, styles.inputWithIcon]}
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
            {emailStatus === "checking" && (
              <ActivityIndicator size="small" color="#999" style={styles.inputIcon} />
            )}
            {emailStatus === "available" && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.inputIcon} />
            )}
            {emailStatus === "unavailable" && (
              <Ionicons name="close-circle" size={24} color="#F44336" style={styles.inputIcon} />
            )}
          </View>
          {emailStatus === "unavailable" && (
            <Text style={styles.errorText}>Email già registrata</Text>
          )}
          {emailStatus === "available" && (
            <Text style={styles.successText}>Email disponibile ✓</Text>
          )}

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
      <AlertComponent />
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
    paddingTop: 20, // Ridotto: header è ora fisso
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center" as const,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
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
    width: 120,
    height: 120,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
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
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
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
  inputContainer: {
    position: "relative" as const,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputIcon: {
    position: "absolute" as const,
    right: 14,
    top: 14,
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#F44336",
    marginBottom: 16,
    marginTop: -4,
  },
  successText: {
    fontSize: 12,
    color: "#4CAF50",
    marginBottom: 16,
    marginTop: -4,
  },
  registerButton: {
    backgroundColor: "#2196F3",
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
    color: "#2196F3",
    fontWeight: "700" as const,
  },
};

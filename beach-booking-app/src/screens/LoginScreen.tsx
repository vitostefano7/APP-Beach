import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import API_URL from "../config/api";

export default function LoginScreen({ navigation }: any) {
  const { login } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({
        title: "Errore",
        message: "Inserisci email e password",
        type: "error"
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        showAlert({
          title: "Errore",
          message: "Credenziali non valide",
          type: "error"
        });
        return;
      }

      const data = await res.json();

      // 🔐 salva token + user nel context
      // Estrai i dati utente dalla risposta del server
      const userData = {
        id: data.user._id || data.user.id,
        role: data.user.role,
        name: data.user.name,
        surname: data.user.surname,
        username: data.user.username,
        email: data.user.email,
        createdAt: data.user.createdAt,
        avatarUrl: data.user.avatarUrl,
        profilePrivacy: data.user.profilePrivacy,
      };
      
      login(data.token, userData);
    } catch (error) {
      console.error("Errore login:", error);
      showAlert({
        title: "Errore",
        message: "Impossibile contattare il server",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Accedi</Text>

            {/* EMAIL */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                // Focus sul campo password quando si preme "next"
                // Dovrai aggiungere una ref per questo, ma per ora andiamo con questa soluzione
              }}
            />

            {/* PASSWORD */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Accesso..." : "Accedi"}
              </Text>
            </Pressable>

            <Pressable 
              style={styles.linkContainer}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.link}>Non hai un account? Registrati</Text>
            </Pressable>
            
            <Pressable 
              style={styles.linkContainer}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={[styles.link, styles.smallLink]}>
                Hai dimenticato la password?
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 20,
    paddingTop: 60, // Spazio in alto per alzare il contenuto
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 40,
    color: "#1a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#2b8cee",
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#2b8cee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  link: {
    color: "#2b8cee",
    fontWeight: "600",
    fontSize: 16,
  },
  smallLink: {
    fontSize: 14,
    color: "#666",
  },
});
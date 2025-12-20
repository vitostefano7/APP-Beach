import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"player" | "owner">("player");

  const handleRegister = async () => {
    const res = await fetch("http://192.168.1.112:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) return;

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrazione</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* SCELTA RUOLO */}
      <View style={styles.roleRow}>
        <Pressable
          style={[
            styles.roleButton,
            role === "player" && styles.roleActive,
          ]}
          onPress={() => setRole("player")}
        >
          <Text>Giocatore</Text>
        </Pressable>

        <Pressable
          style={[
            styles.roleButton,
            role === "owner" && styles.roleActive,
          ]}
          onPress={() => setRole("owner")}
        >
          <Text>Gestore</Text>
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrati</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  roleActive: {
    backgroundColor: "#eaf3ff",
    borderColor: "#2b8cee",
  },
  button: {
    backgroundColor: "#2b8cee",
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    textAlign: "center",
  },
});

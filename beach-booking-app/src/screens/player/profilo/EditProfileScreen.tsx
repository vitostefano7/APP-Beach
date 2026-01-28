import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function EditProfileScreen({ navigation }: any) {
  const { user, login, token } = useContext(AuthContext);

  if (!user) return null;

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const handleSave = async () => {
    // 👉 per ora aggiorniamo SOLO in locale
    const updatedUser = {
      ...user,
      name,
      email,
    };

    // riutilizziamo login per aggiornare lo user
    login(token!, updatedUser);

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modifica profilo</Text>

      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Salva</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#ef8f00",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

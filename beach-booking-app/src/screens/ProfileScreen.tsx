import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout, login, token } = useContext(AuthContext);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Nessun utente</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🔁 edit mode
  const [isEditing, setIsEditing] = useState(false);

  // 📝 form locale
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setIsEditing(false);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("http://192.168.1.112:3000/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        throw new Error("Errore aggiornamento profilo");
      }

      const updatedUser = await res.json();

      // aggiorna contesto globale
      login(token!, updatedUser);

      setIsEditing(false);
    } catch (err) {
      console.log("Errore update profilo", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Il mio profilo</Text>
          <Pressable onPress={logout}>
            <Text style={styles.logout}>Logout</Text>
          </Pressable>
        </View>

        {/* AVATAR */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dati personali</Text>

          {/* NOME */}
          <View style={styles.row}>
            <Text style={styles.label}>Nome</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            ) : (
              <Text style={styles.value}>{user.name}</Text>
            )}
          </View>

          {/* EMAIL */}
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.value}>{user.email}</Text>
            )}
          </View>

          {/* RUOLO */}
          <View style={styles.row}>
            <Text style={styles.label}>Ruolo</Text>
            <Text style={styles.value}>{user.role}</Text>
          </View>

          {/* AZIONI */}
          {!isEditing ? (
            <Pressable
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editText}>Modifica profilo</Text>
            </Pressable>
          ) : (
            <View style={styles.editActions}>
              <Pressable onPress={handleCancel}>
                <Text style={styles.cancelText}>Annulla</Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? "Salvataggio..." : "Salva"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f6f7f9",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    padding: 20,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  logout: {
    color: "#e53935",
    fontWeight: "600",
  },

  /* Avatar */
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ef8f00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 4,
  },
  avatarText: {
    fontSize: 44,
    color: "white",
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  /* Card */
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#999",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  label: {
    color: "#666",
  },
  value: {
    fontWeight: "600",
  },

  /* Edit */
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    minWidth: 160,
    textAlign: "right",
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ef8f00",
    alignItems: "center",
  },
  editText: {
    color: "#ef8f00",
    fontWeight: "600",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    alignItems: "center",
  },
  cancelText: {
    color: "#999",
    fontWeight: "600",
    marginRight: 16,
  },
  saveButton: {
    backgroundColor: "#ef8f00",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveText: {
    color: "white",
    fontWeight: "700",
  },
});

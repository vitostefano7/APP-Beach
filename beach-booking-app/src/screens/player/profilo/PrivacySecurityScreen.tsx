import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useContext } from "react";
import { useTheme } from "./ThemeContext";
import { AuthContext } from "../../../context/AuthContext";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import API_URL from "../../../config/api";

export default function PrivacySecurityScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token } = useContext(AuthContext);
  const { showAlert, AlertComponent } = useCustomAlert();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const validatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert({ type: 'error', title: 'Errore', message: 'Compila tutti i campi' });
      return false;
    }

    if (newPassword.length < 8) {
      showAlert({ type: 'error', title: 'Errore', message: 'La nuova password deve essere almeno 8 caratteri' });
      return false;
    }

    if (newPassword !== confirmPassword) {
      showAlert({ type: 'error', title: 'Errore', message: 'Le password non coincidono' });
      return false;
    }

    if (currentPassword === newPassword) {
      showAlert({ type: 'error', title: 'Errore', message: 'La nuova password deve essere diversa da quella attuale' });
      return false;
    }

    return true;
  };

  const handleSubmitPasswordChange = async () => {
    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/me/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert({ type: 'success', title: 'Successo', message: 'Password modificata con successo' });
        handleCloseModal();
      } else {
        showAlert({ type: 'error', title: 'Errore', message: data.message || "Password attuale non corretta" });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile modificare la password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactor = () => {
    showAlert({ type: 'info', title: 'Autenticazione a due fattori', message: 'Funzionalità in arrivo' });
  };

  const handleDeleteAccount = () => {
    showAlert({
      type: 'warning',
      title: 'Elimina account',
      message: 'Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.',
      buttons: [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: () => showAlert({ type: 'info', title: 'Account eliminato', message: 'Funzionalità in arrivo' }),
        }
      ]
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.background }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy e sicurezza</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoBox, { backgroundColor: isDark ? colors.success + "20" : "#E8F5E9" }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: isDark ? colors.success : "#2E7D32" }]}>
            La tua sicurezza è la nostra priorità. Gestisci le tue impostazioni di privacy
          </Text>
        </View>

        {/* SICUREZZA */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sicurezza</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Pressable style={styles.item} onPress={handleChangePassword}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: isDark ? colors.primary + "30" : "#E3F2FD" }]}>
                <Ionicons name="key-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Cambia password</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                  Ultima modifica 3 mesi fa
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable style={styles.item} onPress={handleTwoFactor}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: isDark ? colors.success + "30" : "#E8F5E9" }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.success} />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                  Autenticazione a due fattori
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Non attiva</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* PRIVACY */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Pressable style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: isDark ? colors.warning + "30" : "#FFF3E0" }]}>
                <Ionicons name="eye-outline" size={22} color={colors.warning} />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Visibilità profilo</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Pubblico</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: isDark ? "#4A148C30" : "#F3E5F5" }]}>
                <Ionicons name="analytics-outline" size={22} color="#9C27B0" />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>Condivisione dati</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                  Gestisci le tue preferenze
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* SESSIONI */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sessioni attive</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sessionItem}>
            <View style={styles.sessionLeft}>
              <View style={[styles.itemIcon, { backgroundColor: isDark ? colors.primary + "30" : "#E3F2FD" }]}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionDevice, { color: colors.text }]}>iPhone 14 Pro</Text>
                <Text style={[styles.sessionLocation, { color: colors.textSecondary }]}>
                  Milano, Italia
                </Text>
                <Text style={[styles.sessionTime, { color: colors.textSecondary }]}>Attiva ora</Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
            </View>
          </View>
        </View>

        {/* ZONA PERICOLO */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Zona pericolo</Text>
        <View style={[styles.dangerCard, { backgroundColor: isDark ? colors.error + "20" : "#FFEBEE", borderColor: colors.error }]}>
          <Pressable style={styles.dangerItem} onPress={handleDeleteAccount}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: isDark ? colors.error + "30" : "#FFEBEE" }]}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </View>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle, { color: colors.error }]}>Elimina account</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                  Questa azione è permanente e irreversibile
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: isDark ? colors.primary + "30" : "#E3F2FD" }]}>
                <Ionicons name="key" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Cambia Password</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Inserisci la tua password attuale e scegli una nuova password sicura
              </Text>
            </View>

            {/* Password Inputs */}
            <View style={styles.inputsContainer}>
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Password attuale</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Inserisci password attuale"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Ionicons
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Nuova password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Almeno 8 caratteri"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Conferma password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Reinserisci nuova password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Password Requirements */}
              <View style={[styles.requirementsBox, { backgroundColor: isDark ? colors.primary + "15" : "#E3F2FD" }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.requirementsText, { color: isDark ? colors.primary : "#1976D2" }]}>
                  La password deve contenere almeno 8 caratteri
                </Text>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.background }]}
                onPress={handleCloseModal}
                disabled={isLoading}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annulla</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: colors.primary }]}
                onPress={handleSubmitPasswordChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={[styles.modalButtonText, { color: "white" }]}>Caricamento...</Text>
                ) : (
                  <Text style={[styles.modalButtonText, { color: "white" }]}>Conferma</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  container: {
    flex: 1,
    padding: 16,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
  },

  divider: {
    height: 1,
    marginVertical: 16,
  },

  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  sessionLocation: {
    fontSize: 13,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
  },
  activeBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  dangerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  dangerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  inputsContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  requirementsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  requirementsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  modalButtonConfirm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
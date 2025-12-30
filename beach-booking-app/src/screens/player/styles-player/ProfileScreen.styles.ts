import { StyleSheet } from "react-native";

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  error: string;
  warning: string;
  success: string;
  border: string;
}

export const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    loadingText: {
      color: colors.textSecondary,
      fontWeight: "600",
      fontSize: 16,
    },

    hero: {
      backgroundColor: colors.card,
      alignItems: "center",
      paddingTop: 24,
      paddingBottom: 32,
    },

    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },

    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: colors.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },

    avatarText: {
      color: "white",
      fontSize: 36,
      fontWeight: "800",
    },

    editAvatarButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.success,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.card,
    },

    name: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },

    email: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 12,
    },

    memberBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: isDark ? colors.primary + "30" : "#E3F2FD",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    memberText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },

    stats: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      marginTop: -20,
      marginBottom: 16,
    },

    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    statIconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    statValue: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },

    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "600",
      textAlign: "center",
    },

    favorite: {
      backgroundColor: isDark ? colors.error + "20" : "#FFEBEE",
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.error,
      borderStyle: "dashed",
    },

    favoriteHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },

    favoriteTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.error,
    },

    favoriteName: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginLeft: 16,
      marginBottom: 12,
    },

    card: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    menuIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },

    menuTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 2,
    },

    menuSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    prefRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    prefIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },

    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },

    logout: {
      marginHorizontal: 16,
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? colors.error + "20" : "#FFEBEE",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.error,
    },

    logoutText: {
      color: colors.error,
      fontWeight: "700",
      fontSize: 16,
    },

    version: {
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 20,
    },
  });
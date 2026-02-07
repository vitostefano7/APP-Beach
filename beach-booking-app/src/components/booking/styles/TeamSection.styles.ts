import { StyleSheet, Platform } from "react-native";

export const createTeamSectionStyles = (variant: 'owner' | 'player') => {
  const baseStyles = {
    teamTitle: {
      fontSize: variant === 'owner' ? 15 : 16,
      fontWeight: variant === 'owner' ? "700" : "800",
      flex: 1,
      color: "white",
      letterSpacing: variant === 'owner' ? undefined : -0.2,
    },
    teamHeaderRight: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    teamCount: {
      fontSize: variant === 'owner' ? 13 : 14,
      fontWeight: "600",
      color: "white",
    },
    teamSlotsContainer: {
      padding: variant === 'owner' ? 12 : 28,
      gap: 8,
    },
    emptyTeamCard: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: 24,
      backgroundColor: variant === 'owner' ? "#f8f9fa" : undefined,
      borderRadius: variant === 'owner' ? 12 : undefined,
      margin: variant === 'owner' ? 12 : undefined,
    },
    emptyTeamText: {
      fontSize: 16,
      color: "#666",
      fontWeight: "600",
      marginBottom: 8,
    },
    emptyTeamHint: {
      fontSize: 14,
      color: "#999",
      textAlign: "center" as const,
    },
    emptyIcon: variant === 'player' ? {
      marginBottom: 10,
    } : {},
    // Player card styles
    playerSlot: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      padding: 12,
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      gap: 12,
    },
    emptySlotInvite: {
      backgroundColor: "#E3F2FD",
      borderWidth: 2,
      borderColor: "#2196F3",
      borderStyle: "dashed" as const,
    },
    inviteAvatarCircle: {
      backgroundColor: "white",
    },
    playerAvatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#2196F3",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    playerInitials: {
      fontSize: 14,
      fontWeight: "800",
      color: "white",
    },
    playerInfoSlot: {
      flex: 1,
    },
    playerNameSlot: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1a1a1a",
      marginBottom: 2,
    },
    playerUsernameSlot: {
      fontSize: 12,
      color: "#666",
    },
    organizerIndicator: {
      fontSize: 12,
      color: "#2196F3",
      fontWeight: "600",
    },
  };

  const variantStyles = variant === 'owner' ? {
    teamSection: {
      overflow: "hidden",
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    teamHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      padding: 12,
      gap: 8,
      borderRadius: 12,
    },
  } : {
    teamSection: {
      borderWidth: 1,
      borderColor: "#e8e8e8",
      borderRadius: 14,
      backgroundColor: "#fff",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    teamHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.2)",
      borderRadius: 12,
    },
  };

  return StyleSheet.create({
    ...baseStyles,
    ...variantStyles,
  });
};
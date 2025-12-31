import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  
  loading: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12 
  },
  
  loadingText: { 
    color: "#666", 
    fontWeight: "600", 
    fontSize: 16 
  },
  
  hero: { 
    backgroundColor: "white", 
    alignItems: "center", 
    paddingTop: 24, 
    paddingBottom: 32 
  },
  
  avatarContainer: { 
    position: "relative", 
    marginBottom: 16 
  },
  
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "#2196F3", 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 4, 
    borderColor: "white", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4 
  },
  
  avatarText: { 
    color: "white", 
    fontSize: 36, 
    fontWeight: "800" 
  },
  
  editAvatarButton: { 
    position: "absolute", 
    bottom: 0, 
    right: 0, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: "#4CAF50", 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 3, 
    borderColor: "white" 
  },
  
  name: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1a1a1a", 
    marginBottom: 4 
  },
  
  email: { 
    color: "#666", 
    fontSize: 14, 
    marginBottom: 12 
  },
  
  memberBadge: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    backgroundColor: "#E3F2FD", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  
  memberText: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: "#2196F3" 
  },
  
  stats: { 
    flexDirection: "row", 
    gap: 12, 
    paddingHorizontal: 16, 
    marginTop: -20, 
    marginBottom: 16 
  },
  
  statCard: { 
    flex: 1, 
    backgroundColor: "white", 
    borderRadius: 16, 
    padding: 16, 
    alignItems: "center", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  
  statIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 8,
    position: "relative",
  },

  statBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5252",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  statBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  
  statValue: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#1a1a1a", 
    marginBottom: 4 
  },
  
  statLabel: { 
    fontSize: 11, 
    color: "#999", 
    fontWeight: "600", 
    textAlign: "center" 
  },
  
  favorite: { 
    backgroundColor: "#FFEBEE", 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: "#F44336", 
    borderStyle: "dashed" 
  },
  
  favoriteHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginBottom: 8 
  },
  
  favoriteTitle: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: "#F44336" 
  },
  
  favoriteName: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#1a1a1a" 
  },
  
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: "800", 
    color: "#999", 
    textTransform: "uppercase", 
    letterSpacing: 0.5, 
    marginLeft: 16, 
    marginBottom: 12 
  },
  
  card: { 
    backgroundColor: "white", 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    padding: 16, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  
  menuItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  
  menuIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  
  menuTitle: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#1a1a1a", 
    marginBottom: 2 
  },
  
  menuSubtitle: { 
    fontSize: 13, 
    color: "#666" 
  },
  
  prefRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  
  prefIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  
  divider: { 
    height: 1, 
    backgroundColor: "#f0f0f0", 
    marginVertical: 16 
  },
  
  logout: { 
    marginHorizontal: 16, 
    marginTop: 8, 
    padding: 16, 
    borderRadius: 12, 
    backgroundColor: "#FFEBEE", 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    gap: 8, 
    borderWidth: 1.5, 
    borderColor: "#F44336" 
  },
  
  logoutText: { 
    color: "#F44336", 
    fontWeight: "700", 
    fontSize: 16 
  },
  
  version: { 
    textAlign: "center", 
    color: "#999", 
    fontSize: 12, 
    marginTop: 20 
  },
});
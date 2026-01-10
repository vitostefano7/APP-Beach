import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  /* =========================
     LAYOUT BASE
  ========================= */
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  loadingText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },

  /* =========================
     HEADER
  ========================= */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },

  avatarWrapper: {
    position: "relative",
  },

  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },

  headerInfo: {
    flex: 1,
  },

  greeting: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 2,
  },

  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
  },

  todayBadgeText: {
    fontSize: 11,
    color: "#2196F3",
    fontWeight: "700",
  },

  headerRight: {
    flexDirection: "row",
    gap: 12,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "white",
  },

  badgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "800",
  },

  /* =========================
     STATS ROW
  ========================= */
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
    gap: 8,
  },

  statCardHighlight: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  statContent: {
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },

  /* =========================
     SECTIONS
  ========================= */
  section: {
    marginTop: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  sectionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  sectionLinkText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },

  /* =========================
     BOOKING TODAY CARD
  ========================= */
  bookingCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  bookingTimeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  bookingTime: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  bookingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bookingInfo: {
    flex: 1,
    gap: 6,
  },

  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  bookingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  bookingActions: {
    flexDirection: "row",
    gap: 8,
  },

  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  /* =========================
     STRUTTURA QUICK CARD
  ========================= */
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },

  strutturaCard: {
    width: 200,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  strutturaImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
  },

  strutturaImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },

  strutturaOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  strutturaStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  strutturaStatusText: {
    fontSize: 10,
    color: "white",
    fontWeight: "700",
  },

  strutturaInfo: {
    padding: 12,
  },

  strutturaName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  strutturaLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },

  strutturaCityText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },

  strutturaBookingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  strutturaBookingsText: {
    fontSize: 11,
    color: "#2196F3",
    fontWeight: "600",
  },

  /* =========================
     ACTIVITY FEED
  ========================= */
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  activityContent: {
    flex: 1,
  },

  activityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  activityMetaText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },

  activityMetaDot: {
    fontSize: 12,
    color: "#ccc",
  },

  activityRight: {
    alignItems: "flex-end",
    gap: 4,
  },

  activityTime: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },

  activityPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9C27B0",
  },

  /* =========================
     MATCH CARDS
  ========================= */
  matchCard: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  matchGradientHeader: {
    padding: 11,
    paddingBottom: 1,
  },
  matchDateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  matchDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  matchDateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    textTransform: "capitalize",
  },
  matchTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  matchCardHeaderInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchTimeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  matchTimeWhite: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  matchStatusBadgeWhite: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  matchSportBadgeFloating: {
    position: "absolute",
    bottom: 10,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  matchSportTextBlue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2196F3",
    marginLeft: 4,
  },
  matchCardContent: {
    padding: 16,
  },
  matchOrganizerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  matchOrganizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: "hidden",
  },
  matchOrganizerAvatarImage: {
    width: "100%",
    height: "100%",
  },
  matchOrganizerAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  matchOrganizerInfo: {
    flex: 1,
  },
  matchOrganizerLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
  matchOrganizerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  matchLocationContainerEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  matchLocationIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#E3F2FD",
  },
  matchLocationTextBold: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  matchTeamLabelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#E3F2FD",
  },
  matchVsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
  },
  matchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  matchTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 6,
  },
  matchStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  matchLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  matchLocationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  matchSportBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    marginBottom: 12,
  },
  matchSportText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2196F3",
    marginLeft: 4,
  },
  matchTeamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  matchTeam: {
    flex: 1,
    alignItems: "center",
  },
  matchTeamLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#2196F3",
  },
  matchPlayersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchPlayerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: -6,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  matchPlayerAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  matchPlayerAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  matchPlayersCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1a1a1a",
    marginLeft: 10,
  },
  matchVs: {
    fontSize: 11,
    fontWeight: "900",
    color: "#666",
  },
  matchCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  matchVisibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchVisibilityText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  matchStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  matchStatusLabel: {
    fontSize: 11,
    color: "#666",
  },
  matchCountBadge: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  matchCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  /* =========================
     EMPTY STATE
  ========================= */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },

  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  emptyButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "700",
  },

  /* Empty State Small */
  emptyStateSmall: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyStateSmallText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

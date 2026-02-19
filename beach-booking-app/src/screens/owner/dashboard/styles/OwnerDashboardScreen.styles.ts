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
    paddingBottom: 100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  /* =========================
     HEADER
  ========================= */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  avatarWrapper: {
    position: "relative",
  },

  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    borderWidth: 1.5,
    borderColor: "white",
  },

  headerInfo: {
    flex: 1,
  },

  greeting: {
    fontSize: 10,
    color: "#999",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },

  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 1,
  },

  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 3,
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: "#EEF6FF",
    borderRadius: 10,
  },

  todayBadgeText: {
    fontSize: 9,
    color: "#2196F3",
    fontWeight: "600",
  },

  headerRight: {
    flexDirection: "row",
    gap: 8,
  },

  notificationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF5252",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: "white",
  },

  badgeText: {
    fontSize: 8,
    color: "white",
    fontWeight: "700",
  },

  /* =========================
     STATS ROW
  ========================= */
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    alignItems: "center",
    gap: 4,
  },

  statCardHighlight: {
    borderWidth: 1.5,
    borderColor: "#4CAF50",
  },

  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  statContent: {
    alignItems: "center",
  },

  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 0,
  },

  statLabel: {
    fontSize: 9,
    color: "#999",
    fontWeight: "500",
  },

  /* =========================
     SECTIONS
  ========================= */
  section: {
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  sectionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  sectionLinkText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
  },

  /* =========================
     BOOKING TODAY CARD
  ========================= */
  bookingCard: {
    backgroundColor: "white",
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 18,
    overflow: "hidden",
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2196F3",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },

  bookingTimeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  timeLabel: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },

  bookingTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },

  bookingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },

  bookingInfo: {
    flex: 1,
    gap: 5,
  },

  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  bookingText: {
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "500",
  },

  bookingActions: {
    flexDirection: "row",
    gap: 5,
  },

  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },

  /* =========================
     STRUTTURA QUICK CARD
  ========================= */
  horizontalScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },

  strutturaCard: {
    width: 160,
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    justifyContent: "space-between",
    minHeight: 180,
  },

  strutturaImage: {
    width: "100%",
    height: 85,
    backgroundColor: "#f5f5f5",
  },

  strutturaImagePlaceholder: {
    width: "100%",
    height: 85,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },

  strutturaOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
  },

  strutturaStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  strutturaStatusText: {
    fontSize: 9,
    color: "white",
    fontWeight: "700",
  },

  strutturaInfo: {
    padding: 9,
    flex: 1,
  },

  strutturaName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },

  strutturaLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 5,
  },

  strutturaCityText: {
    fontSize: 10,
    color: "#999",
    fontWeight: "400",
    flex: 1,
  },

  strutturaBookingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#EEF6FF",
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  strutturaBookingsText: {
    fontSize: 10,
    color: "#2196F3",
    fontWeight: "600",
  },

  dettagliButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: "#2196F3",
    borderRadius: 6,
    marginHorizontal: 9,
    marginBottom: 9,
  },

  dettagliButtonText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },

  /* =========================
     ACTIVITY FEED
  ========================= */
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    marginHorizontal: 14,
    marginBottom: 5,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },

  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  activityContent: {
    flex: 1,
  },

  activityText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 2,
  },

  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  activityMetaText: {
    fontSize: 10,
    color: "#bbb",
    fontWeight: "400",
  },

  activityMetaDot: {
    fontSize: 11,
    color: "#ddd",
  },

  activityRight: {
    alignItems: "flex-end",
    gap: 3,
  },

  activityTime: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "500",
  },

  activityPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9C27B0",
  },

  /* =========================
     MATCH CARDS
  ========================= */
  matchCard: {
    width: 230,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    overflow: "hidden",
  },
  matchGradientHeader: {
    padding: 9,
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  matchDateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  matchDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  matchDateText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    textTransform: "capitalize",
  },
  matchTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  matchCardHeaderInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchTimeIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },
  matchTimeWhite: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  matchStatusBadgeWhite: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 8,
  },
  matchSportBadgeFloating: {
    position: "absolute",
    bottom: 9,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  matchSportTextBlue: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2196F3",
    marginLeft: 3,
  },
  matchCardContent: {
    padding: 10,
  },
  matchOrganizerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  matchOrganizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    overflow: "hidden",
  },
  matchOrganizerAvatarImage: {
    width: "100%",
    height: "100%",
  },
  matchOrganizerAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  matchOrganizerInfo: {
    flex: 1,
  },
  matchOrganizerLabel: {
    fontSize: 10,
    color: "#aaa",
    marginBottom: 1,
  },
  matchOrganizerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  matchLocationContainerEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  matchLocationIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#EEF6FF",
  },
  matchLocationTextBold: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  matchTeamLabelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 7,
    backgroundColor: "#EEF6FF",
  },
  matchVsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  matchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  matchTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 5,
  },
  matchStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  matchStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  matchLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  matchLocationText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 3,
    flex: 1,
  },
  matchSportBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#EEF6FF",
    borderRadius: 8,
    marginBottom: 10,
  },
  matchSportText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2196F3",
    marginLeft: 3,
  },
  matchTeamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#f5f5f5",
  },
  matchTeam: {
    flex: 1,
    alignItems: "center",
  },
  matchTeamLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#D32F2F",
  },
  matchPlayersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchPlayerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: -5,
    borderWidth: 1.5,
    borderColor: "#2196F3",
  },
  matchPlayerAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 9,
  },
  matchPlayerAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 9,
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  matchPlayerAvatarMore: {
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  matchPlayerAvatarMoreText: {
    fontSize: 10,
    fontWeight: "700",
  },
  matchPlayersCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1a1a1a",
    marginLeft: 8,
  },
  matchVs: {
    fontSize: 10,
    fontWeight: "900",
    color: "#666",
  },
  matchCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  matchVisibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchVisibilityText: {
    fontSize: 10,
    color: "#666",
    marginLeft: 3,
  },
  matchStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  matchStatusLabel: {
    fontSize: 10,
    color: "#666",
  },
  matchCountBadge: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 14,
    minWidth: 22,
    alignItems: "center",
  },
  matchCountText: {
    fontSize: 11,
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
    paddingHorizontal: 32,
    paddingVertical: 48,
  },

  emptyIcon: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 5,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#2196F3",
    borderRadius: 16,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  emptyButtonText: {
    fontSize: 13,
    color: "white",
    fontWeight: "600",
  },

  /* Empty State Small */
  emptyStateSmall: {
    paddingVertical: 28,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  emptyStateSmallText: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
  },
});

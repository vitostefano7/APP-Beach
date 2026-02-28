import { Pressable, Text, View } from "react-native";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../../../components/Avatar";
import SportIcon from "../../../../components/SportIcon";
import { AuthContext } from "../../../../context/AuthContext";
import { Booking } from "./types";
import {
  formatDate,
  formatSportName,
  getMatchBadgeInfo,
  getMatchStatus,
  getPaymentModeLabel,
  getRegistrationCloseStatus,
  getTimeStatus,
  isMatchPassed,
  isOngoingBooking,
  isPastBooking,
  isUpcomingBooking,
} from "./utils";
import { styles } from "../Booking/styles";

interface BookingCardProps {
  item: Booking;
  onPress: () => void;
}

export function BookingCard({ item, onPress }: BookingCardProps) {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!item) {
    console.log("⚠️ BookingCard: item is null/undefined");
    return null;
  }

  if (!item.campo) {
    console.log("⚠️ BookingCard: item.campo is missing", item._id);
  }

  const isPast = isPastBooking(item);
  const isOngoing = isOngoingBooking(item);
  const isUpcoming = isUpcomingBooking(item);
  const isCancelled = item.status === "cancelled";
  const timeStatus = getTimeStatus(item);
  const matchBadgeInfo = getMatchBadgeInfo(item);
  const matchStatus = getMatchStatus(item);
  const needsScore = matchStatus === "not_completed" && isMatchPassed(item);
  const paymentLabel = getPaymentModeLabel(item.paymentMode);
  const matchVisibilityLabel = `Partita: ${item.match?.isPublic ? "Pubblica" : "Privata"}`;

  const match = item.match;
  const maxPlayersPerTeam = match ? Math.floor(match.maxPlayers / 2) : 0;
  const teamAConfirmed = match?.players?.filter((p) => p.status === "confirmed" && p.team === "A").length || 0;
  const teamBConfirmed = match?.players?.filter((p) => p.status === "confirmed" && p.team === "B").length || 0;
  const teamsComplete = teamAConfirmed === maxPlayersPerTeam && teamBConfirmed === maxPlayersPerTeam;

  const canOwnerInsert = needsScore && user?.role === "owner" && teamsComplete;

  const confirmedPlayerIds = new Set(
    (item.match?.players || [])
      .filter((player) => player.status === "confirmed")
      .map((player) => {
        const playerUser = player.user as any;
        return typeof playerUser === "string" ? playerUser : playerUser?._id || playerUser?.id;
      })
      .filter(Boolean)
      .map((id) => String(id))
  );

  const getPaymentUserId = (payment: NonNullable<Booking["payments"]>[number]) => {
    const paymentUser = payment.user as any;
    return typeof paymentUser === "string" ? paymentUser : paymentUser?._id || paymentUser?.id;
  };

  const completedPayments = (item.payments || []).filter((payment) => payment?.status === "completed");
  const refundedPayments = (item.payments || []).filter((payment) => payment?.status === "refunded");

  const paidByConfirmed = completedPayments.reduce((sum, payment) => {
    if (!confirmedPlayerIds.size) {
      return sum + (payment.amount || 0);
    }
    const paymentUserId = getPaymentUserId(payment);
    if (paymentUserId && confirmedPlayerIds.has(String(paymentUserId))) {
      return sum + (payment.amount || 0);
    }
    return sum;
  }, 0);

  const refundedByConfirmed = refundedPayments.reduce((sum, payment) => {
    if (!confirmedPlayerIds.size) {
      return sum + (payment.amount || 0);
    }
    const paymentUserId = getPaymentUserId(payment);
    if (paymentUserId && confirmedPlayerIds.has(String(paymentUserId))) {
      return sum + (payment.amount || 0);
    }
    return sum;
  }, 0);

  const totalPrice = Number(item.price || 0);
  const paidByConfirmedNet = Math.max(0, Number((paidByConfirmed - refundedByConfirmed).toFixed(2)));
  const paidAmount = paidByConfirmedNet;

  if (__DEV__ && item.paymentMode === "split") {
    console.log("💳 [OwnerBookingCard][split-debug]", {
      bookingId: item._id,
      confirmedPlayerIds: Array.from(confirmedPlayerIds),
      completedPayments: completedPayments.map((payment) => ({
        userId: String(getPaymentUserId(payment) || ""),
        amount: Number(payment.amount || 0),
        status: payment.status,
      })),
      refundedPayments: refundedPayments.map((payment) => ({
        userId: String(getPaymentUserId(payment) || ""),
        amount: Number(payment.amount || 0),
        status: payment.status,
      })),
      paidByConfirmed,
      refundedByConfirmed,
      paidByConfirmedNet,
      totalPrice,
    });
  }

  const hasPartialSplitPayment =
    item.paymentMode === "split" && paidAmount < totalPrice && totalPrice > 0;

  const priceLabel = hasPartialSplitPayment ? "Pagato / Totale" : "Prezzo";
  const priceValue = hasPartialSplitPayment
    ? `€${formatPrice(paidAmount)} / €${formatPrice(totalPrice)}`
    : `€${formatPrice(totalPrice)}`;

  if (!item._id) {
    console.log("⚠️ Invalid booking item, skipping render");
    return null;
  }

  return (
    <Pressable
      style={[styles.card, isOngoing && styles.ongoingCard, isCancelled && styles.cancelledCard]}
      onPress={onPress}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
          <View style={styles.metaLabelsRow}>
            <View style={styles.metaLabelPill}>
              <Text style={styles.metaLabelText}>{paymentLabel}</Text>
            </View>
            <View style={styles.metaLabelPill}>
              <Text style={styles.metaLabelText}>{matchVisibilityLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusBadgeContainer}>
          {isCancelled ? (
            <View style={[styles.statusBadge, styles.statusBadgeCancelled]}>
              <Text style={[styles.statusBadgeText, styles.statusBadgeTextCancelled]}>Cancellata</Text>
            </View>
          ) : (
            <View
              style={[
                styles.statusBadge,
                isOngoing ? styles.statusBadgeOngoing : isPast ? styles.statusBadgePast : styles.statusBadgeUpcoming,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {!isPast && !isOngoing && (
                  <Ionicons name="hourglass-outline" size={13} color="#2196F3" style={{ marginRight: 3 }} />
                )}
                <Text
                  style={[
                    styles.statusBadgeText,
                    isOngoing
                      ? styles.statusBadgeTextOngoing
                      : isPast
                      ? styles.statusBadgeTextPast
                      : styles.statusBadgeTextUpcoming,
                  ]}
                >
                  {timeStatus}
                </Text>
              </View>
              {!isPast && !isOngoing && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <Ionicons name="lock-closed-outline" size={13} color="#2196F3" style={{ marginRight: 3 }} />
                  <Text style={{ fontSize: 11, color: "#2196F3", fontWeight: "700" }}>
                    {getRegistrationCloseStatus(item)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {matchBadgeInfo && (
            <View style={[styles.matchStatusBadgeInline, { backgroundColor: matchBadgeInfo.bgColor }]}>
              <Ionicons name={matchBadgeInfo.icon as any} size={12} color={matchBadgeInfo.color} />
              <Text style={[styles.matchStatusTextInline, { color: matchBadgeInfo.color }]}>{matchBadgeInfo.text}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardContent}>
        <View style={styles.infoRowMain}>
          <Avatar
            name={item.user?.name}
            surname={item.user?.surname}
            avatarUrl={item.user?.avatarUrl}
            size={32}
            fallbackIcon="person"
            style={{ marginRight: 2 }}
          />
          <Text style={styles.userNameText}>
            {item.user?.name || "N/A"} {item.user?.surname || ""}
          </Text>
        </View>

        <View style={styles.infoRowSub}>
          <Ionicons name="location-outline" size={16} color="#2196F3" />
          <Text style={styles.locationText}>
            {item.campo?.struttura?.name || "Struttura"} • {item.campo?.name || "Campo"}
          </Text>
        </View>

        <View style={styles.infoRowSub}>
          <SportIcon sport={item.campo?.sport?.code || "beach_volley"} size={16} color="#2196F3" />
          <Text style={styles.locationText}>{item.campo?.sport?.name || formatSportName(item.campo?.sport?.code)}</Text>
        </View>
      </View>

      {canOwnerInsert && (
        <View style={styles.scoreButtonContainer}>
          <Pressable
            style={styles.scoreButton}
            onPress={() => {
              navigation.navigate("OwnerDettaglioPrenotazione", {
                bookingId: item._id,
                openScoreEntry: true,
              });
            }}
          >
            <Ionicons name="clipboard" size={18} color="#FF9800" />
            <Text style={styles.scoreButtonText}>Inserisci risultato</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF9800" />
          </Pressable>
        </View>
      )}

      <View style={styles.cardFooterBlue}>
        <View style={styles.priceContainerBlue}>
          <Text style={styles.priceLabelBlue}>{priceLabel}</Text>
          <Text style={styles.priceValueBlue}>{priceValue}</Text>
        </View>
        <View style={styles.actionButtonBlue}>
          <Text style={styles.actionButtonTextBlue}>Vedi dettagli</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

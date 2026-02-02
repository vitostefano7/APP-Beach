import { useMemo } from 'react';

export const useMatchLogic = (booking: any) => {
  const isMatchInProgress = useMemo(() => {
    if (!booking) return false;
    const now = new Date();
    const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
    const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
    return now >= matchDateTime && now <= matchEndTime;
  }, [booking]);

  const isMatchPassed = useMemo(() => {
    if (!booking) return false;
    const now = new Date();
    const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
    return now > matchEndTime;
  }, [booking]);

  const getTimeUntilRegistrationDeadline = useMemo(() => {
    if (!booking) return null;
    const now = new Date();
    const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
    const deadlineTime = new Date(matchStartTime.getTime() - (45 * 60 * 1000));
    const diffMs = deadlineTime.getTime() - now.getTime();

    if (diffMs <= 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, [booking]);

  const isRegistrationOpen = useMemo(() => {
    if (!booking) return false;
    const now = new Date();
    const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
    const deadlineTime = new Date(matchStartTime.getTime() - (45 * 60 * 1000));
    return now < deadlineTime;
  }, [booking]);

  const getMatchStatus = useMemo(() => {
    const match = booking?.match;
    if (!match) return "open";

    const confirmedPlayers = match.players?.filter((p: any) => p.status === "confirmed").length || 0;
    const isPublic = match.isPublic;
    const teamsIncomplete = confirmedPlayers < match.maxPlayers;

    if (isMatchInProgress && match.status !== "completed" && match.status !== "cancelled") {
      if (isPublic && teamsIncomplete) {
        return "cancelled";
      }
      return "in_progress";
    }

    if (isMatchPassed && match.status !== "cancelled") {
      if (isPublic && teamsIncomplete) {
        return "cancelled";
      }

      if (!match.score || match.score.sets.length === 0) {
        return "not_completed";
      }

      if (match.score && match.score.sets.length > 0) {
        return "completed";
      }
    }

    if (!isMatchPassed && match.status === "open") {
      if (teamsIncomplete) {
        return "not_team_completed";
      }
    }

    return match.status;
  }, [booking, isMatchInProgress, isMatchPassed]);

  const getMatchStatusInfo = useMemo(() => {
    const match = booking?.match;
    if (!match) return { color: "#999", text: "Nessun Match", icon: "help-circle" as const };

    const effectiveStatus = getMatchStatus;

    if (effectiveStatus === "in_progress") {
      return { color: "#FF9800", text: "In Corso", icon: "play-circle" as const };
    }

    switch (effectiveStatus) {
      case "completed":
        return { color: "#4CAF50", text: "Completato", icon: "trophy" as const };
      case "cancelled":
        return { color: "#F44336", text: "Cancellato", icon: "close-circle" as const };
      case "full":
        return { color: "#4CAF50", text: "Completo", icon: "checkmark-circle" as const };
      case "not_team_completed":
        return { color: "#FF9800", text: "Team non completi", icon: "people" as const };
      case "not_completed":
        return { color: "#FF9800", text: "Non completato", icon: "time" as const };
      case "open":
        return { color: "#2196F3", text: "Aperto", icon: "people" as const };
      default:
        return { color: "#999", text: effectiveStatus, icon: "help-circle" as const };
    }
  }, [booking, getMatchStatus]);

  return {
    isMatchInProgress,
    isMatchPassed,
    getTimeUntilRegistrationDeadline,
    isRegistrationOpen,
    getMatchStatus,
    getMatchStatusInfo,
  };
};
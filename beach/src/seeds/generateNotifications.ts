// seeds/generateNotifications.ts
import Notification from "../models/Notification";
import { randomInt } from "./config";

/**
 * Genera notifiche realistiche in linea con quelle prodotte dai controller:
 *
 * - new_booking       → owner struttura quando un giocatore prenota
 * - booking_cancelled → giocatori quando l'owner cancella la prenotazione
 * - match_invite      → giocatore invitato dal creatore del match
 * - match_join        → creatore del match quando un giocatore entra (pubblico)
 * - match_result      → giocatori confermati quando viene inserito il risultato
 * - invite_accepted   → organizzatore quando il giocatore accetta l'invito
 * - invite_declined   → organizzatore quando il giocatore rifiuta l'invito
 * - new_follower      → utente quando qualcuno inizia a seguirlo
 * - follow_back       → utente quando il follow è reciproco
 */
export async function generateNotifications(
  users: any[],
  matches: any[],
  bookings: any[],
  strutture: any[],
  campi: any[]
) {
  console.log(`🔔 Creazione notifiche...`);

  const notificationsData: any[] = [];

  // ─── Helper ────────────────────────────────────────────────────────────────
  const ago = (days: number) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const findStruttura = (strutturaId: any) =>
    strutture.find((s: any) => s._id.toString() === strutturaId?.toString());

  const findCampo = (campoId: any) =>
    campi.find((c: any) => c._id.toString() === campoId?.toString());

  const push = (data: object) => notificationsData.push(data);

  // Giocatori (non owner)
  const players = users.filter((u: any) => u.role !== "owner");

  // ── 1. new_booking ─────────────────────────────────────────────────────────
  // L'owner della struttura riceve una notifica ogni volta che arriva una
  // prenotazione confermata.
  for (const booking of bookings) {
    const struttura = findStruttura(booking.struttura);
    if (!struttura) continue;
    const campo = findCampo(booking.campo);
    const campoName = campo?.name || "Campo";
    const strutturaName = struttura.name || "la struttura";
    const booker = users.find((u: any) => u._id.toString() === booking.user?.toString());
    if (!booker) continue;

    push({
      recipient: struttura.owner,
      sender: booking.user,
      type: "new_booking",
      title: "Nuova prenotazione confermata",
      message: `${booker.name} ha prenotato ${campoName} presso ${strutturaName} il ${booking.date} alle ${booking.startTime || "ora non specificata"}`,
      relatedId: booking._id,
      relatedModel: "Booking",
      isRead: Math.random() > 0.5,
      createdAt: ago(randomInt(0, 20)),
    });
  }

  // ── 2. booking_cancelled ───────────────────────────────────────────────────
  // Quando l'owner cancella una prenotazione, ogni giocatore confermato del
  // match associato riceve un avviso di rimborso.
  const cancelledSample = bookings.slice(0, Math.max(1, Math.floor(bookings.length * 0.15)));
  for (const booking of cancelledSample) {
    const struttura = findStruttura(booking.struttura);
    if (!struttura) continue;
    const campo = findCampo(booking.campo);
    const campoName = campo?.name || "il campo";
    const strutturaName = struttura.name || "la struttura";

    const relatedMatch = matches.find(
      (m: any) => m.booking?.toString() === booking._id.toString()
    );
    const affectedPlayers = relatedMatch?.players?.length
      ? relatedMatch.players
          .filter((p: any) => p.status === "confirmed")
          .slice(0, 3)
      : players.slice(0, 2);

    for (const p of affectedPlayers) {
      const playerId = p.user?._id || p.user || p._id;
      push({
        recipient: playerId,
        sender: struttura.owner,
        type: "booking_cancelled",
        title: "Prenotazione cancellata - Rimborso",
        message: `La prenotazione per ${campoName} presso ${strutturaName} il ${booking.date} è stata cancellata. Riceverai un rimborso nei prossimi giorni.`,
        relatedId: booking._id,
        relatedModel: "Booking",
        isRead: Math.random() > 0.4,
        createdAt: ago(randomInt(1, 15)),
      });
    }
  }

  // ── 3. match_invite ────────────────────────────────────────────────────────
  // Il creatore del match invita direttamente un giocatore.
  for (const match of matches) {
    if (!match.createdBy || !match._id) continue;

    // Prendi al massimo 2 giocatori invitati per match (non il creatore)
    const candidates = players.filter(
      (u: any) => u._id.toString() !== match.createdBy.toString()
    );
    if (!candidates.length) continue;

    const numInvites = Math.min(2, candidates.length, randomInt(1, 3));
    for (let i = 0; i < numInvites; i++) {
      const invited = candidates[i];
      push({
        recipient: invited._id,
        sender: match.createdBy,
        type: "match_invite",
        title: "Invito a partita",
        message: `Sei stato invitato a una partita`,
        relatedId: match._id,
        relatedModel: "Match",
        isRead: Math.random() > 0.5,
        createdAt: ago(randomInt(0, 10)),
      });
    }
  }

  // ── 4. match_join ──────────────────────────────────────────────────────────
  // Il creatore del match riceve una notifica quando un giocatore si unisce
  // a un match pubblico.
  const publicMatches = matches.filter((m: any) => m.isPublic);
  for (const match of publicMatches) {
    if (!match.createdBy || !match.players?.length) continue;

    const joiners = match.players
      .filter((p: any) => {
        const pid = p.user?._id || p.user;
        return pid?.toString() !== match.createdBy.toString();
      })
      .slice(0, 2);

    const relatedBooking = bookings.find(
      (b: any) => b._id.toString() === match.booking?.toString()
    );
    const campo = relatedBooking ? findCampo(relatedBooking.campo) : null;
    const struttura = relatedBooking ? findStruttura(relatedBooking.struttura) : null;
    const locationStr = campo && struttura
      ? `${campo.name} (${struttura.name})`
      : "il campo";

    for (const p of joiners) {
      const joinerId = p.user?._id || p.user;
      const joinerUser = users.find((u: any) => u._id.toString() === joinerId?.toString());
      const joinerName = joinerUser?.name || "Un giocatore";

      push({
        recipient: match.createdBy,
        sender: joinerId,
        type: "match_join",
        title: `Nuovo giocatore: ${joinerName}`,
        message: `${joinerName} si è unito al tuo match su ${locationStr}`,
        relatedId: relatedBooking?._id || match._id,
        relatedModel: relatedBooking ? "Booking" : "Match",
        isRead: Math.random() > 0.5,
        createdAt: ago(randomInt(0, 7)),
      });
    }
  }

  // ── 5. match_result ────────────────────────────────────────────────────────
  // I giocatori confermati ricevono una notifica quando viene inserito il
  // risultato di una partita conclusa.
  const completedMatches = matches.filter((m: any) => m.status === "completed");
  for (const match of completedMatches) {
    if (!match.players?.length || !match.createdBy) continue;

    const relatedBooking = bookings.find(
      (b: any) => b._id.toString() === match.booking?.toString()
    );
    const struttura = relatedBooking ? findStruttura(relatedBooking.struttura) : null;
    const strutturaName = struttura?.name || "la struttura";
    const dateStr = relatedBooking?.date
      ? new Date(relatedBooking.date).toLocaleDateString("it-IT")
      : "data non disponibile";

    const confirmedPlayers = match.players.filter(
      (p: any) =>
        p.status === "confirmed" &&
        (p.user?._id || p.user)?.toString() !== match.createdBy.toString()
    );

    for (const p of confirmedPlayers) {
      const pid = p.user?._id || p.user;
      push({
        recipient: pid,
        sender: match.createdBy,
        type: "match_result",
        title: "Risultato partita inserito",
        message: `È stato inserito un risultato per la partita presso ${strutturaName} del ${dateStr}`,
        relatedId: relatedBooking?._id || match._id,
        relatedModel: relatedBooking ? "Booking" : "Match",
        isRead: Math.random() > 0.4,
        createdAt: ago(randomInt(0, 5)),
      });
    }
  }

  // ── 6. invite_accepted / invite_declined ───────────────────────────────────
  // L'organizzatore sa se un giocatore invitato ha accettato o rifiutato.
  for (const match of matches) {
    if (!match.createdBy || !match.players?.length) continue;

    const relatedBooking = bookings.find(
      (b: any) => b._id.toString() === match.booking?.toString()
    );
    const struttura = relatedBooking ? findStruttura(relatedBooking.struttura) : null;
    const strutturaName = struttura?.name || "la struttura";
    const dateStr = relatedBooking?.date
      ? new Date(relatedBooking.date).toLocaleDateString("it-IT")
      : "data non disponibile";

    // Prendi al massimo 1 "risposta" per match per non gonfiare il seed
    const responders = match.players
      .filter((p: any) => {
        const pid = p.user?._id || p.user;
        return pid?.toString() !== match.createdBy.toString();
      })
      .slice(0, 1);

    for (const p of responders) {
      const responderId = p.user?._id || p.user;
      const responderUser = users.find(
        (u: any) => u._id.toString() === responderId?.toString()
      );
      const responderName = responderUser?.name || "Un giocatore";
      const accepted = Math.random() > 0.3;
      const type = accepted ? "invite_accepted" : "invite_declined";
      const actionText = accepted ? "accettato" : "rifiutato";

      push({
        recipient: match.createdBy,
        sender: responderId,
        type,
        title: `${responderName} ha ${actionText} l'invito`,
        message: `${responderName} ha ${actionText} l'invito per la partita presso ${strutturaName} del ${dateStr}`,
        relatedId: relatedBooking?._id || match._id,
        relatedModel: relatedBooking ? "Booking" : "Match",
        isRead: Math.random() > 0.5,
        createdAt: ago(randomInt(0, 10)),
      });
    }
  }

  // ── 7. new_follower & follow_back ──────────────────────────────────────────
  // Simuliamo interazioni social tra giocatori.
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  const followPairs = shuffledPlayers.slice(0, Math.min(20, players.length));

  for (let i = 0; i < followPairs.length - 1; i++) {
    const follower = followPairs[i];
    const followed = followPairs[i + 1];
    if (!follower || !followed) continue;

    push({
      recipient: followed._id,
      sender: follower._id,
      type: "new_follower",
      title: `${follower.name} ha iniziato a seguirti`,
      message: `${follower.name} (@${follower.username || follower.name}) ti sta seguendo`,
      relatedId: follower._id,
      relatedModel: "User",
      isRead: Math.random() > 0.5,
      createdAt: ago(randomInt(0, 30)),
    });

    // ~40% di probabilità di follow reciproco
    if (Math.random() < 0.4) {
      push({
        recipient: follower._id,
        sender: followed._id,
        type: "follow_back",
        title: `${followed.name} ti segue ora`,
        message: `Ora tu e ${followed.name} vi seguite a vicenda`,
        relatedId: followed._id,
        relatedModel: "User",
        isRead: Math.random() > 0.5,
        createdAt: ago(randomInt(0, 25)),
      });
    }
  }

  // ── Inserisci tutto ────────────────────────────────────────────────────────
  const notifications = await Notification.insertMany(notificationsData);
  const unread = notificationsData.filter((n) => !n.isRead).length;
  console.log(`✅ ${notifications.length} notifiche create (${unread} non lette)`);

  return notifications;
}

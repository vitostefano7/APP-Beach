import { useMemo } from 'react';

/* =======================
   INTERFACES
======================= */
interface Booking {
  id: string;
  status: string;
  price: number;
  duration?: number; // Durata prenotazione in ore
  date?: string;
  startDate?: string;
  bookingDate?: string;
  createdAt?: string;
  user?: {
    _id: string;
    name: string;
    surname?: string;
  };
  [key: string]: any;
}

interface Struttura {
  id: string;
  _id?: string;
  [key: string]: any;
}

interface Campo {
  _id: string;
  name: string;
  struttura: string;
  weeklySchedule?: {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
  };
  [key: string]: any;
}

interface DaySchedule {
  open: string;   // es. "09:00"
  close: string;  // es. "21:00"
  enabled?: boolean;
  closed?: boolean;
}

interface OwnerStatsCalculated {
  strutture: number;
  prenotazioni: number;
  incassoTotale: number;
  incassoOggi: number;
  incassoSettimana: number;
  incassoMese: number;
  rimborsiOggi: number;
  rimborsiSettimana: number;
  rimborsiMese: number;
  tassoOccupazione: number;
  nuoviClienti: number;
  businessPeriodStats: {
    oggi: {
      prenotazioni: number;
      tassoOccupazione: number;
      clientiUnici: number;
      clientiNuovi: number;
    };
    settimana: {
      prenotazioni: number;
      tassoOccupazione: number;
      clientiUnici: number;
      clientiNuovi: number;
    };
    mese: {
      prenotazioni: number;
      tassoOccupazione: number;
      clientiUnici: number;
      clientiNuovi: number;
    };
  };
}

/**
 * Hook per calcolare le statistiche owner basate su bookings e strutture
 * 
 * Calcola statistiche business real-time:
 * - Incassi per periodo (oggi, settimana, mese, totale)
 * - Tasso occupazione REALISTICO basato su ore effettive vs disponibili
 * - Numero clienti unici
 * - Conteggio prenotazioni e strutture
 * 
 * @param bookings Array di prenotazioni (tutte, non solo confermate)
 * @param strutture Array di strutture dell'owner
 * @param campi Array di campi di tutte le strutture (con weeklySchedule)
 * @returns Oggetto con tutte le statistiche calcolate
 * 
 * @example
 * const stats = useOwnerStats(bookings, strutture, campi);
 * console.log(stats.tassoOccupazione); // es. 12%
 */
export const useOwnerStats = (
  bookings: Booking[],
  strutture: Struttura[],
  campi: Campo[]
): OwnerStatsCalculated => {
  return useMemo(() => {
    console.log('\n📈 ========== CALCOLO STATISTICHE OWNER ==========');

    const parseBookingDate = (booking: Booking): Date | null => {
      const rawDate = booking.date || booking.startDate || booking.bookingDate || booking.createdAt;
      if (!rawDate) return null;

      if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const [year, month, day] = rawDate.split("-").map(Number);
        return new Date(year, month - 1, day);
      }

      const parsed = new Date(rawDate);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getBookingAmount = (booking: Booking): number => Number(booking.ownerEarnings ?? booking.price ?? 0) || 0;

    const getRefundAmount = (booking: Booking): number => {
      if (typeof booking.refundAmount === "number") {
        return Math.max(0, booking.refundAmount);
      }

      return getBookingAmount(booking);
    };

    const isRefundedBooking = (booking: Booking): boolean => {
      const status = String(booking.status || "").toLowerCase();
      const payments = Array.isArray(booking.payments) ? booking.payments : [];
      const hasRefundedPayment = payments.some((payment: any) => {
        const paymentStatus = String(payment?.status || "").toLowerCase();
        return paymentStatus === "refunded" || paymentStatus === "partial_refunded";
      });

      return (
        status === "cancelled" ||
        status === "canceled" ||
        hasRefundedPayment ||
        booking.refundedAt != null ||
        booking.refundAmount != null
      );
    };

    const aggregateRevenue = (items: Booking[]) => {
      let revenueLorda = 0;
      let rimborsi = 0;

      for (const booking of items) {
        const status = String(booking.status || "").toLowerCase();

        if (status !== "cancelled" && status !== "canceled") {
          revenueLorda += getBookingAmount(booking);
        }

        if (isRefundedBooking(booking)) {
          rimborsi += getRefundAmount(booking);
        }
      }

      return {
        revenueLorda,
        rimborsi,
        revenueNetta: revenueLorda - rimborsi,
      };
    };
    
    // Filtra solo prenotazioni confermate
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    
    console.log(`📦 Prenotazioni totali: ${bookings.length}`);
    console.log(`✅ Prenotazioni confermate: ${confirmedBookings.length}`);
    console.log(`🏢 Strutture: ${strutture.length}`);
    console.log(`⚽ Campi: ${campi.length}\n`);
    
    // Calcola incasso totale
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allBookingsUntilToday = bookings.filter((booking) => {
      const bookingDate = parseBookingDate(booking);
      return !!bookingDate && bookingDate < tomorrow;
    });

    const totaleRevenue = aggregateRevenue(allBookingsUntilToday);
    const incassoTotale = totaleRevenue.revenueNetta;

    // Definisci periodi temporali
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    console.log(`📅 Periodo riferimento settimana: da ${weekAgo.toLocaleDateString()} ad oggi`);
    console.log(`📅 Periodo riferimento mese: da ${monthAgo.toLocaleDateString()} ad oggi`);

    // Calcola incassi per periodo (usa date della prenotazione)
    const isDateInRange = (date: Date, from: Date, toExclusive: Date) => date >= from && date < toExclusive;

    const bookingsOggi = bookings.filter((booking) => {
      const bookingDate = parseBookingDate(booking);
      return !!bookingDate && isDateInRange(bookingDate, today, tomorrow);
    });

    const bookingsSettimana = bookings.filter((booking) => {
      const bookingDate = parseBookingDate(booking);
      return !!bookingDate && isDateInRange(bookingDate, weekAgo, tomorrow);
    });

    const bookingsMese = bookings.filter((booking) => {
      const bookingDate = parseBookingDate(booking);
      return !!bookingDate && isDateInRange(bookingDate, monthAgo, tomorrow);
    });

    const revenueOggi = aggregateRevenue(bookingsOggi);
    const revenueSettimana = aggregateRevenue(bookingsSettimana);
    const revenueMese = aggregateRevenue(bookingsMese);

    const incassoOggi = revenueOggi.revenueNetta;
    const incassoSettimana = revenueSettimana.revenueNetta;
    const incassoMese = revenueMese.revenueNetta;
    const rimborsiOggi = revenueOggi.rimborsi;
    const rimborsiSettimana = revenueSettimana.rimborsi;
    const rimborsiMese = revenueMese.rimborsi;

    // Calcola clienti unici
    const nuoviClienti = new Set(
      bookings
        .filter((b) => b.user?._id)
        .map((b) => b.user!._id)
    ).size;

    const getBookingDurationHours = (booking: Booking): number => {
      let duration = Number(booking.duration);

      if (Number.isFinite(duration) && duration > 0) {
        return duration;
      }

      try {
        const start = booking.startTime || booking.slotStart;
        const end = booking.endTime || booking.slotEnd;
        if (start && end) {
          const [startH, startM] = start.split(":").map(Number);
          const [endH, endM] = end.split(":").map(Number);
          const calc = (endH + endM / 60) - (startH + startM / 60);
          if (calc > 0) return calc;
        }
      } catch {
        return 1;
      }

      return 1;
    };

    const getUniqueClientsCount = (items: Booking[]) =>
      new Set(items.filter((b) => b.user?._id).map((b) => b.user!._id)).size;

    const extractId = (value: any): string | undefined => {
      if (!value) return undefined;
      if (typeof value === "string") return value;
      if (typeof value === "object") {
        if (typeof value._id === "string") return value._id;
        if (typeof value.id === "string") return value.id;
      }
      return undefined;
    };

    const getBookingStrutturaId = (booking: Booking): string | undefined => {
      const bookingCampo = booking.campo as any;
      return extractId(bookingCampo?.struttura) ?? extractId((booking as any).struttura);
    };

    const firstConfirmedByStrutturaUser = new Map<string, Date>();

    confirmedBookings.forEach((booking) => {
      const userId = booking.user?._id;
      const bookingDate = parseBookingDate(booking);

      if (!userId || !bookingDate) return;

      const strutturaId = getBookingStrutturaId(booking) || "unknown";
      const scopeKey = `${strutturaId}::${userId}`;
      const existingDate = firstConfirmedByStrutturaUser.get(scopeKey);

      if (!existingDate || bookingDate < existingDate) {
        firstConfirmedByStrutturaUser.set(scopeKey, bookingDate);
      }
    });

    const getNewClientsCountInRange = (from: Date, toExclusive: Date): number => {
      let count = 0;

      firstConfirmedByStrutturaUser.forEach((firstBookingDate) => {
        if (firstBookingDate >= from && firstBookingDate < toExclusive) {
          count += 1;
        }
      });

      return count;
    };

    /* =======================
       TASSO OCCUPAZIONE MENSILE
       
       Calcolo REALISTICO su base mensile:
       - Calcola ore disponibili mensili dai weeklySchedule (× 4.33 settimane)
       - Confronta con ore prenotate nell'ultimo mese
       - Formula: (ore ultimo mese / ore mensili) × 100
    ======================= */
    
    /**
     * Calcola ore disponibili da un orario (es. "09:00" a "21:00" = 12 ore)
     */
    const calculateHoursFromSchedule = (open: string, close: string): number => {
      try {
        const [openH, openM] = open.split(':').map(Number);
        const [closeH, closeM] = close.split(':').map(Number);
        const totalHours = (closeH + closeM / 60) - (openH + openM / 60);
        return totalHours > 0 ? totalHours : 0;
      } catch {
        return 0;
      }
    };

    // Calcola ore settimanali disponibili per campo
    const getTotalWeeklyHours = (campo: Campo, verbose: boolean = false): number => {
      if (!campo.weeklySchedule) {
        console.log(`    ⚠️ Campo "${campo.name}": nessun weeklySchedule definito`);
        return 0;
      }

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      let weeklyHours = 0;

      for (const day of days) {
        const schedule: any = campo.weeklySchedule[day as keyof typeof campo.weeklySchedule];
        
        // Controlla se enabled è false o closed è true - in quel caso il giorno è CHIUSO
        const isEnabled = schedule?.enabled !== false;
        const isClosed = schedule?.closed === true;
        
        if (schedule && isEnabled && !isClosed && schedule.open && schedule.close) {
          const hours = calculateHoursFromSchedule(schedule.open, schedule.close);
          console.log(`      ${day}: ${schedule.open}-${schedule.close} = ${hours.toFixed(1)}h`);
          weeklyHours += hours;
        } else if (schedule) {
          console.log(`      ${day}: CHIUSO (enabled: ${isEnabled}, closed: ${isClosed})`);
        }
      }

      return weeklyHours;
    };

    // Somma ore disponibili settimanali di TUTTI i campi
    console.log('🔍 [TASSO OCCUPAZIONE MENSILE] Inizio calcolo');
    console.log(`📊 Numero strutture owner: ${strutture.length}`);
    console.log(`📊 Strutture IDs owner:`, strutture.map(s => s._id || s.id));
    console.log(`📊 Numero campi ricevuti: ${campi.length}`);
    
    // Verifica corrispondenza campi-strutture
    const struttureIds = new Set(strutture.map(s => s._id || s.id));
    const campiFiltered = campi.filter(c => struttureIds.has(c.struttura));
    
    console.log(`✅ Campi che appartengono alle strutture owner: ${campiFiltered.length}`);
    
    const oreDisponibiliSettimana = campiFiltered.reduce((total, campo) => {
      const weeklyHours = getTotalWeeklyHours(campo, false);
      console.log(`  ⏰ Campo "${campo.name}" (struttura: ${campo.struttura}): ${weeklyHours.toFixed(1)} ore settimanali disponibili`);
      return total + weeklyHours;
    }, 0);

    const confirmedBookingsOggi = bookingsOggi.filter((b) => b.status === "confirmed");
    const confirmedBookingsSettimana = bookingsSettimana.filter((b) => b.status === "confirmed");
    const confirmedBookingsMese = bookingsMese.filter((b) => b.status === "confirmed");

    const orePrenotateOggi = confirmedBookingsOggi.reduce(
      (sum, booking) => sum + getBookingDurationHours(booking),
      0
    );
    const orePrenotateSettimana = confirmedBookingsSettimana.reduce(
      (sum, booking) => sum + getBookingDurationHours(booking),
      0
    );
    const orePrenotateMesePeriodo = confirmedBookingsMese.reduce(
      (sum, booking) => sum + getBookingDurationHours(booking),
      0
    );
    
    // Calcola ore mensili: ore settimanali × 4.33 (media settimane al mese)
    const oreDisponibiliMese = oreDisponibiliSettimana * 4.33;
    const oreDisponibiliGiorno = oreDisponibiliSettimana / 7;
    
    console.log(`✅ Ore disponibili settimanali TOTALI: ${oreDisponibiliSettimana.toFixed(1)} ore`);
    console.log(`✅ Ore disponibili mensili TOTALI: ${oreDisponibiliMese.toFixed(1)} ore`);

    const calculateOccupancy = (bookedHours: number, availableHours: number): number => {
      if (availableHours <= 0) return 0;
      return Math.min(100, Math.round((bookedHours / availableHours) * 100));
    };

    const businessPeriodStats = {
      oggi: {
        prenotazioni: bookingsOggi.length,
        tassoOccupazione: calculateOccupancy(orePrenotateOggi, oreDisponibiliGiorno),
        clientiUnici: getUniqueClientsCount(bookingsOggi),
        clientiNuovi: getNewClientsCountInRange(today, tomorrow),
      },
      settimana: {
        prenotazioni: bookingsSettimana.length,
        tassoOccupazione: calculateOccupancy(orePrenotateSettimana, oreDisponibiliSettimana),
        clientiUnici: getUniqueClientsCount(bookingsSettimana),
        clientiNuovi: getNewClientsCountInRange(weekAgo, tomorrow),
      },
      mese: {
        prenotazioni: bookingsMese.length,
        tassoOccupazione: calculateOccupancy(orePrenotateMesePeriodo, oreDisponibiliMese),
        clientiUnici: getUniqueClientsCount(bookingsMese),
        clientiNuovi: getNewClientsCountInRange(monthAgo, tomorrow),
      },
    };
    
    // Ore effettivamente prenotate nell'ultimo mese (solo confermate E CONCLUSE)
    const bookingsLastMonth = confirmedBookings.filter((b) => {
      const bookingDate = parseBookingDate(b);
      if (!bookingDate) return false;
      // IMPORTANTE: solo prenotazioni CONCLUSE (tra monthAgo e ieri, esclude oggi)
      return bookingDate >= monthAgo && bookingDate < today;
    });
    
    console.log(`📅 Prenotazioni confermate CONCLUSE ultimo mese (${monthAgo.toLocaleDateString()} - ${new Date(today.getTime() - 1).toLocaleDateString()}): ${bookingsLastMonth.length}`);
    
    const orePrenotateMese = bookingsLastMonth.reduce((sum, b) => {
      let duration = Number(b.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        try {
          const start = b.startTime || b.slotStart;
          const end = b.endTime || b.slotEnd;
          if (start && end) {
            const [startH, startM] = start.split(":").map(Number);
            const [endH, endM] = end.split(":").map(Number);
            const calc = (endH + endM / 60) - (startH + startM / 60);
            duration = calc > 0 ? calc : 1;
          } else {
            duration = 1;
          }
        } catch {
          duration = 1;
        }
      }

      console.log(`  📝 Prenotazione durata: ${duration} ore (data: ${b.date || b.startDate || b.bookingDate || b.createdAt})`);
      return sum + duration;
    }, 0);
    
    console.log(`✅ Ore prenotate mensili TOTALI: ${orePrenotateMese.toFixed(1)} ore`);

    // Percentuale occupazione mensile (max 100%)
    const tassoOccupazione = oreDisponibiliMese > 0 
      ? Math.min(100, Math.round((orePrenotateMese / oreDisponibiliMese) * 100)) 
      : 0;
    
    console.log(`📊 CALCOLO: (${orePrenotateMese.toFixed(1)} / ${oreDisponibiliMese.toFixed(1)}) × 100 = ${tassoOccupazione}%`);
    console.log('🏁 [TASSO OCCUPAZIONE MENSILE] Fine calcolo\n');

    const stats = {
      strutture: strutture.length,
      prenotazioni: bookings.length,
      incassoTotale,
      incassoOggi,
      incassoSettimana,
      incassoMese,
      rimborsiOggi,
      rimborsiSettimana,
      rimborsiMese,
      tassoOccupazione,
      nuoviClienti,
      businessPeriodStats,
    };

    console.log('💰 Riepilogo Statistiche:');
    console.log(`  • Strutture: ${stats.strutture}`);
    console.log(`  • Prenotazioni: ${stats.prenotazioni}`);
    console.log(`  • Incasso Totale: €${stats.incassoTotale.toFixed(2)}`);
    console.log(`  • Incasso Oggi: €${stats.incassoOggi.toFixed(2)}`);
    console.log(`  • Incasso Settimana: €${stats.incassoSettimana.toFixed(2)}`);
    console.log(`  • Incasso Mese: €${stats.incassoMese.toFixed(2)}`);
    console.log(`  • Rimborsi Oggi: €${stats.rimborsiOggi.toFixed(2)}`);
    console.log(`  • Rimborsi Settimana: €${stats.rimborsiSettimana.toFixed(2)}`);
    console.log(`  • Rimborsi Mese: €${stats.rimborsiMese.toFixed(2)}`);
    console.log(`  • Rimborsi Totali: €${totaleRevenue.rimborsi.toFixed(2)}`);
    console.log(`  • Tasso Occupazione: ${stats.tassoOccupazione}%`);
    console.log(`  • Nuovi Clienti: ${stats.nuoviClienti}`);
    console.log('================================================\n');

    return stats;
  }, [bookings, strutture, campi]);
};

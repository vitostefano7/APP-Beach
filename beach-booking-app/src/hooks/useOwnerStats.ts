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
  closed?: boolean;
}

interface OwnerStatsCalculated {
  strutture: number;
  prenotazioni: number;
  incassoTotale: number;
  incassoOggi: number;
  incassoSettimana: number;
  incassoMese: number;
  tassoOccupazione: number;
  nuoviClienti: number;
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
    
    // Filtra solo prenotazioni confermate
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    
    console.log(`📦 Prenotazioni totali: ${bookings.length}`);
    console.log(`✅ Prenotazioni confermate: ${confirmedBookings.length}`);
    console.log(`🏢 Strutture: ${strutture.length}`);
    console.log(`⚽ Campi: ${campi.length}\n`);
    
    // Calcola incasso totale
    const incassoTotale = confirmedBookings.reduce((sum, b) => sum + (b.price || 0), 0);

    // Definisci periodi temporali
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    console.log(`📅 Periodo riferimento settimana: da ${weekAgo.toLocaleDateString()} ad oggi`);
    console.log(`📅 Periodo riferimento mese: da ${monthAgo.toLocaleDateString()} ad oggi`);

    // Calcola incassi per periodo (usa date della prenotazione)
    const incassoOggi = confirmedBookings
      .filter((b) => {
        const bookingDate = new Date(b.date || b.startDate || b.bookingDate || b.createdAt);
        return bookingDate >= today;
      })
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const incassoSettimana = confirmedBookings
      .filter((b) => {
        const bookingDate = new Date(b.date || b.startDate || b.bookingDate || b.createdAt);
        return bookingDate >= weekAgo;
      })
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const incassoMese = confirmedBookings
      .filter((b) => {
        const bookingDate = new Date(b.date || b.startDate || b.bookingDate || b.createdAt);
        return bookingDate >= monthAgo;
      })
      .reduce((sum, b) => sum + (b.price || 0), 0);

    // Calcola clienti unici
    const nuoviClienti = new Set(
      bookings
        .filter((b) => b.user?._id)
        .map((b) => b.user!._id)
    ).size;

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
        const schedule = campo.weeklySchedule[day as keyof typeof campo.weeklySchedule];
        
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
    
    // Calcola ore mensili: ore settimanali × 4.33 (media settimane al mese)
    const oreDisponibiliMese = oreDisponibiliSettimana * 4.33;
    
    console.log(`✅ Ore disponibili settimanali TOTALI: ${oreDisponibiliSettimana.toFixed(1)} ore`);
    console.log(`✅ Ore disponibili mensili TOTALI: ${oreDisponibiliMese.toFixed(1)} ore`);
    
    // Ore effettivamente prenotate nell'ultimo mese (solo confermate E CONCLUSE)
    const bookingsLastMonth = confirmedBookings.filter((b) => {
      const bookingDate = new Date(b.date || b.startDate || b.bookingDate || b.createdAt);
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
      tassoOccupazione,
      nuoviClienti,
    };

    console.log('💰 Riepilogo Statistiche:');
    console.log(`  • Strutture: ${stats.strutture}`);
    console.log(`  • Prenotazioni: ${stats.prenotazioni}`);
    console.log(`  • Incasso Totale: €${stats.incassoTotale.toFixed(2)}`);
    console.log(`  • Incasso Oggi: €${stats.incassoOggi.toFixed(2)}`);
    console.log(`  • Incasso Settimana: €${stats.incassoSettimana.toFixed(2)}`);
    console.log(`  • Incasso Mese: €${stats.incassoMese.toFixed(2)}`);
    console.log(`  • Tasso Occupazione: ${stats.tassoOccupazione}%`);
    console.log(`  • Nuovi Clienti: ${stats.nuoviClienti}`);
    console.log('================================================\n');

    return stats;
  }, [bookings, strutture, campi]);
};

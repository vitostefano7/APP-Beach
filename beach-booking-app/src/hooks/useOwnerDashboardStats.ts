import { useMemo } from "react";
import { useOwnerStats } from "./useOwnerStats";

/* Local types (kept minimal and compatible with other parts of app) */
interface Booking {
  _id?: string;
  id?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  duration?: number;
  price?: number;
  user?: { _id: string; name: string; surname?: string };
  campo?: { struttura?: { _id?: string; name?: string } };
  [key: string]: any;
}

interface Struttura {
  _id?: string;
  name?: string;
  [key: string]: any;
}

interface Campo {
  _id?: string;
  name?: string;
  struttura?: string;
  weeklySchedule?: any;
  [key: string]: any;
}

type WeeklyStats = { labels: string[]; data: number[] };
type DurationFilter = "all" | 1 | 1.5;

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
  const campo = booking.campo as any;
  return extractId(campo?.struttura) ?? extractId((booking as any).struttura);
};

const getBookingUserId = (booking: Booking): string | undefined => {
  return extractId(booking.user) ?? extractId((booking as any).userId);
};

const getSportName = (sport: any): string | undefined => {
  if (!sport) return undefined;
  if (typeof sport === "string") return sport;
  if (typeof sport === "object") return sport.name || sport._id;
  return undefined;
};

const getBookingDurationHours = (booking: Booking): number => {
  const duration = Number(booking.duration);
  if (Number.isFinite(duration) && duration > 0) {
    return Math.round(duration * 100) / 100;
  }

  if (booking.startTime && booking.endTime) {
    try {
      const [startH, startM] = booking.startTime.split(":").map(Number);
      const [endH, endM] = booking.endTime.split(":").map(Number);
      const calc = (endH + endM / 60) - (startH + startM / 60);
      if (calc > 0) return Math.round(calc * 100) / 100;
    } catch {
      return 1;
    }
  }

  return 1;
};

export const useOwnerDashboardStats = ({
  bookings,
  strutture,
  campi,
  selectedStruttura,
  selectedUser,
  selectedPeriodDays,
  durationFilter = "all",
  selectedSport = "all",
}: {
  bookings: Booking[];
  strutture: Struttura[];
  campi: Campo[];
  selectedStruttura: string;
  selectedUser: string;
  selectedPeriodDays: number;
  durationFilter?: DurationFilter;
  selectedSport?: string;
}) => {
  // filtro per struttura / cliente (lo stesso comportamento della schermata)
  const filteredStrutture = useMemo(
    () => (selectedStruttura === "all" ? strutture : strutture.filter((s) => s._id === selectedStruttura)),
    [strutture, selectedStruttura]
  );

  const filteredCampi = useMemo(
    () => (selectedStruttura === "all" ? campi : campi.filter((c) => c.struttura === selectedStruttura)),
    [campi, selectedStruttura]
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const strutturaId = getBookingStrutturaId(b);
      const userId = getBookingUserId(b);

      if (selectedStruttura !== "all" && strutturaId !== selectedStruttura) return false;
      if (selectedUser !== "all" && userId !== selectedUser) return false;
      if (selectedSport !== "all") {
        const campoId = extractId(b.campo);
        const campo = campi.find((c) => c._id === campoId);
        const sport = getSportName(campo?.sport) ?? getSportName(campo?.type);
        if (sport !== selectedSport) return false;
      }
      return true;
    });
  }, [bookings, selectedStruttura, selectedUser, selectedSport, campi]);

  // reuse existing hook for owner-wide KPIs (incassi, tasso occupazione, ecc.)
  const ownerStats = useOwnerStats(filteredBookings as any, filteredStrutture as any, filteredCampi as any);

  // timeframe filter (ultimi N giorni)
  const periodFilteredBookings = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - (selectedPeriodDays - 1));
    periodStart.setHours(0, 0, 0, 0);

    return filteredBookings.filter((booking) => {
      try {
        const bookingDate = new Date(`${booking.date}T12:00:00`);
        if (isNaN(bookingDate.getTime())) return false;
        return bookingDate >= periodStart && bookingDate <= today;
      } catch {
        return false;
      }
    });
  }, [filteredBookings, selectedPeriodDays]);

  const durationFilteredBookings = useMemo(() => {
    if (durationFilter === "all") return periodFilteredBookings;

    return periodFilteredBookings.filter((booking) => {
      const duration = getBookingDurationHours(booking);
      return Math.abs(duration - durationFilter) < 0.01;
    });
  }, [periodFilteredBookings, durationFilter]);

  // hourly distribution (0-23)
  const hourlyStats = useMemo(() => {
    const hourlyData = new Array(24).fill(0);
    durationFilteredBookings.forEach((booking) => {
      try {
        const hour = parseInt((booking.startTime || "").split(":")[0]);
        if (Number.isFinite(hour) && hour >= 0 && hour < 24) {
          hourlyData[hour]++;
        }
      } catch (e) {
        /* ignore */
      }
    });
    return hourlyData;
  }, [durationFilteredBookings]);

  // weekly distribution (Lun..Dom)
  const weeklyStats: WeeklyStats = useMemo(() => {
    const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
    const weeklyData = new Array(7).fill(0);

    durationFilteredBookings.forEach((booking) => {
      try {
        const date = new Date((booking.date || "") + "T12:00:00");
        if (!isNaN(date.getTime())) {
          const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
          weeklyData[dayOfWeek]++;
        }
      } catch (e) {
        /* ignore */
      }
    });

    return { labels: weekDays, data: weeklyData };
  }, [durationFilteredBookings]);

  // top hours + top users per slot (support 1h and 1.5h grouping)
  const { topHours, topUsersBySlot } = useMemo(() => {
    // Helper to map bookings into a slot key (decimal hours)
    const slotForBooking = (booking: Booking, slotSize: number) => {
      try {
        const timeParts = (booking.startTime || "").split(":");
        const h = parseInt(timeParts[0]);
        const m = parseInt(timeParts[1] || "0");
        if (!Number.isFinite(h)) return undefined;
        const decimalHour = h + (m || 0) / 60;
        const slotStart = Math.floor(decimalHour / slotSize) * slotSize;
        return slotStart;
      } catch (e) {
        return undefined;
      }
    };

    const slotSize = durationFilter === 1.5 ? 1.5 : 1;

    // Count bookings per slot and collect user counts per slot
    const slotCountMap = new Map<number, number>();
    const slotUserMap = new Map<number, Map<string, { name: string; count: number }>>();

    durationFilteredBookings.forEach((booking) => {
      const slot = slotForBooking(booking, slotSize);
      if (slot === undefined) return;
      slotCountMap.set(slot, (slotCountMap.get(slot) || 0) + 1);

      const userId = getBookingUserId(booking) || "unknown";
      const userName = (booking.user && `${booking.user.name}${booking.user.surname ? ' ' + booking.user.surname : ''}`) || 'Anonimo';

      if (!slotUserMap.has(slot)) slotUserMap.set(slot, new Map());
      const userMap = slotUserMap.get(slot)!;
      const existing = userMap.get(userId);
      userMap.set(userId, { name: userName, count: (existing ? existing.count : 0) + 1 });
    });

    const topHoursArr = Array.from(slotCountMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topUsersBySlotObj: Record<number, Array<{ userId: string; name: string; count: number }>> = {};
    slotUserMap.forEach((userMap, slot) => {
      const arr = Array.from(userMap.entries())
        .map(([userId, info]) => ({ userId, name: info.name, count: info.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      topUsersBySlotObj[slot] = arr;
    });

    return { topHours: topHoursArr, topUsersBySlot: topUsersBySlotObj };
  }, [durationFilteredBookings, durationFilter]);


  // struttureStats (tasso occupazione per struttura) - portiamo qui lo stesso calcolo
  const struttureStats = useMemo(() => {
    return strutture.map((struttura) => {
      const strutturaCampi = campi.filter((c) => c.struttura === struttura._id);
      const strutturaBookings = bookings.filter((b) => getBookingStrutturaId(b) === struttura._id);

      const confirmedBookings = strutturaBookings.filter((b) => b.status === "confirmed");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const bookingsLastMonth = confirmedBookings.filter((b) => {
        const bookingDate = new Date(b.date || b.startTime);
        return bookingDate >= monthAgo && bookingDate < today;
      });

      const orePrenotateMese = bookingsLastMonth.reduce((sum, b) => {
        let duration = b.duration || 1;
        if (!b.duration && b.startTime && b.endTime) {
          try {
            const [startH, startM] = b.startTime.split(":").map(Number);
            const [endH, endM] = b.endTime.split(":").map(Number);
            const calc = (endH + endM / 60) - (startH + startM / 60);
            if (calc > 0) duration = calc;
          } catch (e) {
            duration = 1;
          }
        }
        return sum + duration;
      }, 0);

      const oreSettimanali = strutturaCampi.reduce((total, campo) => {
        if (!campo.weeklySchedule) return total;
        let weeklyHours = 0;
        const days = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];
        for (const day of days) {
          const schedule = campo.weeklySchedule[day];
          if (schedule && schedule.enabled !== false && schedule.closed !== true && schedule.open && schedule.close) {
            const [openH, openM] = schedule.open.split(":").map(Number);
            const [closeH, closeM] = schedule.close.split(":").map(Number);
            const hours = (closeH + closeM / 60) - (openH + openM / 60);
            weeklyHours += hours > 0 ? hours : 0;
          }
        }
        return total + weeklyHours;
      }, 0);

      const oreMensili = oreSettimanali * 4.33;
      const tassoOccupazione = oreMensili > 0 ? Math.min(100, Math.round((orePrenotateMese / oreMensili) * 100)) : 0;

      return {
        struttura,
        campiCount: strutturaCampi.length,
        bookingsTotal: strutturaBookings.length,
        bookingsConfirmed: confirmedBookings.length,
        tassoOccupazione,
      };
    });
  }, [bookings, strutture, campi]);

  return {
    filteredStrutture,
    filteredCampi,
    filteredBookings,
    periodFilteredBookings,
    durationFilteredBookings,
    hourlyStats,
    weeklyStats,
    topHours,
    topUsersBySlot,
    struttureStats,
    ownerStats,
  };
};

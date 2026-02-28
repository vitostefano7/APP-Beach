import { parentPort, workerData } from "worker_threads";

type SportInfo = {
  code: string;
  allowsPlayerPricing?: boolean;
  minPlayers?: number;
  maxPlayers?: number;
};

type CampoSeed = {
  _id: string;
  struttura: string;
  sport: SportInfo;
};

type WorkerInput = {
  players: string[];
  campiBySport: Record<string, CampoSeed[]>;
  sportCodes: string[];
  settings: {
    pastBookingsPerSport: number;
    extraPastBookings: number;
    todayBookings: number;
    futureBookingsCount: number;
  };
};

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function createBooking(playerId: string, campo: CampoSeed, date: Date, numPeople: number | undefined) {
  const hour = randomInt(9, 20);
  const duration = randomElement([1, 1.5]);
  const startTime = `${String(hour).padStart(2, "0")}:00`;
  const endHour = duration === 1 ? hour + 1 : hour + 1;
  const endMinutes = duration === 1.5 ? "30" : "00";
  const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;
  const bookingType = numPeople ? "public" : "private";
  const paymentMode = bookingType === "public" ? "split" : "full";
  const totalPrice = randomInt(30, 50);
  const unitPrice = numPeople ? Math.round(totalPrice / numPeople) : undefined;
  const splitInitialPayment = unitPrice ? Math.min(totalPrice, unitPrice) : Math.max(1, Math.round(totalPrice / 2));
  const payments = paymentMode === "split"
    ? [
        {
          user: playerId,
          amount: splitInitialPayment,
          method: "card",
          status: "completed",
          createdAt: new Date(),
        },
      ]
    : [];

  return {
    user: playerId,
    campo: campo._id,
    struttura: campo.struttura,
    date: formatDate(date),
    startTime,
    endTime,
    duration,
    price: totalPrice,
    numberOfPeople: numPeople,
    unitPrice,
    payments,
    status: "confirmed",
    bookingType,
    paymentMode,
    ownerEarnings: totalPrice,
  };
}

function getNumPeople(campo: CampoSeed): number | undefined {
  const sport = campo.sport;
  if (!sport?.allowsPlayerPricing || !sport?.minPlayers || !sport?.maxPlayers) {
    return undefined;
  }

  const possibleCounts: number[] = [];
  for (let players = sport.minPlayers; players <= sport.maxPlayers; players += 2) {
    possibleCounts.push(players);
  }

  if (!possibleCounts.length) {
    return undefined;
  }

  return randomElement(possibleCounts);
}

function run() {
  const { players, campiBySport, sportCodes, settings } = workerData as WorkerInput;
  const bookings: any[] = [];
  const today = new Date();

  for (const playerId of players) {
    for (const sportCode of sportCodes) {
      for (let j = 0; j < settings.pastBookingsPerSport; j++) {
        const campiForSport = campiBySport[sportCode] ?? [];
        if (!campiForSport.length) continue;

        const campo = randomElement(campiForSport);
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - randomInt(1, 90));

        bookings.push(createBooking(playerId, campo, pastDate, getNumPeople(campo)));
      }
    }

    for (let i = 0; i < settings.extraPastBookings; i++) {
      const sportCode = randomElement(sportCodes);
      const campiForSport = campiBySport[sportCode] ?? [];
      if (!campiForSport.length) continue;

      const campo = randomElement(campiForSport);
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - randomInt(1, 90));

      bookings.push(createBooking(playerId, campo, pastDate, getNumPeople(campo)));
    }

    for (let i = 0; i < settings.todayBookings; i++) {
      const sportCode = randomElement(sportCodes);
      const campiForSport = campiBySport[sportCode] ?? [];
      if (!campiForSport.length) continue;

      const campo = randomElement(campiForSport);
      bookings.push(createBooking(playerId, campo, today, getNumPeople(campo)));
    }

    for (let i = 0; i < settings.futureBookingsCount; i++) {
      const sportCode = randomElement(sportCodes);
      const campiForSport = campiBySport[sportCode] ?? [];
      if (!campiForSport.length) continue;

      const campo = randomElement(campiForSport);
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(1, 60));

      bookings.push(createBooking(playerId, campo, futureDate, getNumPeople(campo)));
    }
  }

  parentPort?.postMessage(bookings);
}

run();

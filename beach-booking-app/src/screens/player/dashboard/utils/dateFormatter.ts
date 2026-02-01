export const formatDate = (dateStr: string): string => {
  try {
    const dateStrWithTime = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
    const date = new Date(dateStrWithTime);
    
    if (isNaN(date.getTime())) {
      console.error("Data non valida:", dateStr);
      return dateStr;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    
    if (bookingDate.getTime() === today.getTime()) {
      return "Oggi";
    } else if (bookingDate.getTime() === tomorrow.getTime()) {
      return "Domani";
    } else {
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
  } catch (error) {
    console.error("Errore formattazione data:", error, dateStr);
    return dateStr;
  }
};

export const calculateDaysUntil = (dateStr: string): number => {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatMatchDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  } catch (error) {
    console.error("Errore formattazione data match:", error);
    return dateStr;
  }
};
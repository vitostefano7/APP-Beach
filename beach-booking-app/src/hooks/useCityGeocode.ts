import { useState, useCallback, useRef } from 'react';

type CityValidation = {
  isValidating: boolean;
  isValid: boolean | null;
  coordinates: { lat: number; lng: number } | null;
};

type CitySuggestion = {
  name: string;
  displayName: string;
  region: string;
  lat: number;
  lng: number;
  raw: any;
};

export function useCityGeocode() {
  const [cityValidation, setCityValidation] = useState<CityValidation>({
    isValidating: false,
    isValid: null,
    coordinates: null,
  });
  
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Cerca suggerimenti città con debounce
   */
  const searchCitySuggestions = useCallback(async (searchText: string) => {
    // Cancella timeout precedente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchText.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      setCityValidation({ isValidating: false, isValid: null, coordinates: null });
      return;
    }

    setCityValidation({ isValidating: true, isValid: null, coordinates: null });

    // Debounce di 500ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const geocodeUrl = 
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchText)},Italia&` +
          `format=json&limit=5`;
        
        const geocodeResponse = await fetch(geocodeUrl, {
          headers: { 'User-Agent': 'SportBookingApp/1.0' },
        });
        
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData && geocodeData.length > 0) {
          // Filtra solo risultati in Italia
          const italianResults = geocodeData.filter((result: any) => {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            return lat >= 35.5 && lat <= 47.1 && lng >= 6.6 && lng <= 18.5;
          });

          const suggestions: CitySuggestion[] = italianResults.map((result: any) => ({
            name: result.address?.city || result.address?.town || result.address?.village || result.name,
            displayName: result.display_name,
            region: result.address?.state || result.address?.region || '',
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            raw: result,
          }));

          setCitySuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
          setCityValidation({ 
            isValidating: false, 
            isValid: suggestions.length > 0, 
            coordinates: suggestions.length > 0 ? { lat: suggestions[0].lat, lng: suggestions[0].lng } : null 
          });
          
          console.log('✅ Trovati suggerimenti città:', suggestions.length);
        } else {
          setCitySuggestions([]);
          setShowSuggestions(false);
          setCityValidation({ isValidating: false, isValid: false, coordinates: null });
          console.log('❌ Nessuna città trovata per:', searchText);
        }
      } catch (error) {
        console.error('❌ Errore ricerca città:', error);
        setCitySuggestions([]);
        setShowSuggestions(false);
        setCityValidation({ isValidating: false, isValid: false, coordinates: null });
      }
    }, 500);
  }, []);

  /**
   * Seleziona una città dai suggerimenti
   */
  const selectCity = useCallback((suggestion: CitySuggestion) => {
    setCityValidation({
      isValidating: false,
      isValid: true,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng },
    });
    setShowSuggestions(false);
    setCitySuggestions([]);
    console.log('✅ Città selezionata:', suggestion.name, { lat: suggestion.lat, lng: suggestion.lng });
    
    return {
      city: suggestion.name,
      lat: suggestion.lat,
      lng: suggestion.lng,
    };
  }, []);

  /**
   * Reset dello stato
   */
  const resetValidation = useCallback(() => {
    setCityValidation({ isValidating: false, isValid: null, coordinates: null });
    setCitySuggestions([]);
    setShowSuggestions(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  /**
   * Valida una città specifica (geocoding singolo)
   */
  const validateCity = useCallback(async (cityName: string) => {
    if (!cityName || cityName.length < 2) {
      setCityValidation({ isValidating: false, isValid: null, coordinates: null });
      return null;
    }

    setCityValidation({ isValidating: true, isValid: null, coordinates: null });

    try {
      const geocodeUrl = 
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(cityName)},Italia&` +
        `format=json&limit=1`;
      
      const geocodeRes = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'SportBookingApp/1.0' },
      });
      
      const geocodeData = await geocodeRes.json();
      
      if (geocodeData && geocodeData.length > 0) {
        const lat = parseFloat(geocodeData[0].lat);
        const lng = parseFloat(geocodeData[0].lon);
        setCityValidation({ 
          isValidating: false, 
          isValid: true, 
          coordinates: { lat, lng } 
        });
        console.log('✅ Città validata:', cityName, { lat, lng });
        return { lat, lng };
      } else {
        setCityValidation({ isValidating: false, isValid: false, coordinates: null });
        console.log('❌ Città non trovata:', cityName);
        return null;
      }
    } catch (error) {
      console.error('❌ Errore validazione città:', error);
      setCityValidation({ isValidating: false, isValid: false, coordinates: null });
      return null;
    }
  }, []);

  return {
    cityValidation,
    citySuggestions,
    showSuggestions,
    searchCitySuggestions,
    selectCity,
    resetValidation,
    validateCity,
  };
}

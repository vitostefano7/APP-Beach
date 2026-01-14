import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config/api";

type User = {
  id: string;
  role: "player" | "owner";
  name?: string;
  surname?: string;
  username?: string;
  email?: string;
  createdAt?: string;
  avatarUrl?: string;
  profilePrivacy?: "public" | "private"; // ✅ NUOVO: per la privacy del profilo
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>; // ✅ NUOVO: per aggiornare user
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('🔍 [AuthContext] parsedUser da AsyncStorage:', JSON.stringify(parsedUser, null, 2));
          console.log('🔍 [AuthContext] parsedUser.id:', parsedUser.id, 'parsedUser._id:', parsedUser._id);
          
          // Se l'utente salvato non ha _id, recuperalo dal backend
          if (!parsedUser.id && !parsedUser._id) {
            console.log('📡 [AuthContext] User senza ID, fetching da /users/me/profile...');
            try {
              const res = await fetch(`${API_URL}/users/me/profile`, {
                headers: { Authorization: `Bearer ${storedToken}` },
              });

              console.log('📡 [AuthContext] Response status:', res.status);
              if (res.ok) {
                const data = await res.json();
                console.log('📡 [AuthContext] data da backend:', JSON.stringify(data, null, 2));
                const freshUser = data.user; // L'endpoint restituisce { user, profile, preferences }
                const normalizedUser = {
                  ...freshUser,
                  id: freshUser._id || freshUser.id,
                };
                console.log('✅ [AuthContext] User aggiornato con ID:', normalizedUser.id);
                setToken(storedToken);
                setUser(normalizedUser);
                await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
                setLoading(false);
                return;
              } else {
                console.error('❌ [AuthContext] Response non OK:', res.status);
              }
            } catch (error) {
              console.error('❌ [AuthContext] Errore fetch /users/me/profile:', error);
            }
          } else {
            console.log('✅ [AuthContext] User ha già un ID, normalizzando...');
          }

          // Normalizza l'ID: usa _id se id manca
          const normalizedUser = {
            ...parsedUser,
            id: parsedUser.id || parsedUser._id,
          };
          console.log('🔍 [AuthContext] normalizedUser finale:', JSON.stringify(normalizedUser, null, 2));
          setToken(storedToken);
          setUser(normalizedUser);
        }
      } catch (error) {
        console.error('❌ [AuthContext] Errore loadAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (token: string, user: User) => {
    // Normalizza l'ID: usa _id se id manca
    const normalizedUser = {
      ...user,
      id: user.id || (user as any)._id,
    };
    setToken(token);
    setUser(normalizedUser);
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.clear();
  };

  // ✅ NUOVA FUNZIONE: Aggiorna i dati utente (es. dopo upload avatar)
  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { 
      ...user, 
      ...userData,
      // Mantieni l'ID normalizzato
      id: user.id,
    };
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
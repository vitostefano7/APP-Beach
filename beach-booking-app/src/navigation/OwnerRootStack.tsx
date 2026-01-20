import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OwnerTabs from "./OwnerTabs";
import StrutturaDashboardScreen from "../screens/owner/StrutturaDashboardScreen";
import CreaStrutturaScreen from "../screens/owner/struttura/CreaStruttura/CreaStrutturaScreen";
import AggiungiCampoScreen from "../screens/owner/AggiungiCampoScreen";
import ModificaStrutturaScreen from "../screens/owner/struttura/ModificaStrutturaScreen";
import DettaglioCampoScreen from "../screens/owner/DettaglioCampoScreen";
import ModificaCampoScreen from "../screens/owner/ModificaCampoScreen";
import CampoDisponibilitaScreen from "../screens/owner/CampoDisponibilitaScreen";
import CampoCalendarioGestioneScreen from "../screens/owner/CampoCalendarioGestioneScreen";
import OwnerBookingsScreen from "../screens/owner/prenotazioni/OwnerBookingsScreen";
import DettaglioPrenotazioneOwnerScreen from "../screens/owner/prenotazioni/DettaglioPrenotazioneOwnerScreen";
import InserisciRisultatoScreen from "../screens/InserisciRisultatoScreen";
import ConfiguraPrezziCampoScreen from "../screens/owner/campo/configuraPrezziCampiScreen";
import ChatScreen from "../screens/owner/Comunicazioni/ChatScreen";
import GestisciImmaginiStruttura from "../screens/owner/struttura/GestisciImmaginiStruttura";
import GroupChatScreen from "../screens/owner/Comunicazioni/GroupChatScreen";
import OwnerStruttureScreen from "../screens/owner/OwnerStruttureScreen";
import OwnerCreatePostScreen from "../screens/owner/OwnerCreatePostScreen";
import CercaAmiciScreen from "../screens/player/dashboard/CercaAmiciScreen";
import OwnerCercaAmiciScreen from "../screens/owner/OwnerCercaAmiciScreen";
import UserProfileScreen from "../screens/player/profilo/UserProfileScreen";
import StrutturaDetailScreen from "../screens/player/struttura/StrutturaDetailScreen";
import OwnerNotificheScreen from "../screens/owner/dashboard/OwnerNotificheScreen";
import EarningsStatsScreen from "../screens/owner/EarningsStatsScreen";
import OwnerStatisticsScreen from "../screens/owner/OwnerStatisticsScreen";


export type OwnerRootStackParamList = {
  OwnerTabs: undefined;
  StrutturaDashboard: { strutturaId: string };
  CreaStruttura: undefined;
  AggiungiCampo: { strutturaId: string };
  ModificaStruttura: { strutturaId: string };
  DettaglioCampo: { campoId: string };
  ModificaCampo: { campoId: string };
  OwnerCercaAmiciScreen: undefined;
  OwnerNotifiche: undefined;
  OwnerStatistics: undefined;
  EarningsStats: {
    earnings: {
      totalEarnings: number;
      earnings: Array<{
        type: string;
        amount: number;
        description: string;
        createdAt: string;
        booking?: any;
      }>;
    };
  };
};

const Stack = createNativeStackNavigator<OwnerRootStackParamList>();

export default function OwnerRootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
      <Stack.Screen
        name="OwnerNotifiche"
        component={OwnerNotificheScreen}
      />
      <Stack.Screen
        name="OwnerStatistics"
        component={OwnerStatisticsScreen}
      />
      <Stack.Screen
        name="StrutturaDashboard"
        component={StrutturaDashboardScreen}
      />
      <Stack.Screen
        name="Strutture"
        component={OwnerStruttureScreen}
      />
      <Stack.Screen
        name="CreaStruttura"
        component={CreaStrutturaScreen}
      />
      <Stack.Screen
        name="AggiungiCampo"
        component={AggiungiCampoScreen}
      />
      <Stack.Screen
        name="EarningsStats"
        component={EarningsStatsScreen}
      />
      <Stack.Screen
        name="ModificaStruttura"
        component={ModificaStrutturaScreen}
      />
      <Stack.Screen
        name="OwnerBookings"
        component={OwnerBookingsScreen}
      />
      <Stack.Screen
        name="DettaglioCampo"
        component={DettaglioCampoScreen}
      />
      <Stack.Screen
        name="ModificaCampo"
        component={ModificaCampoScreen}
      />
      <Stack.Screen
        name="CampoDisponibilita"
        component={CampoDisponibilitaScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CampoCalendarioGestione" 
        component={CampoCalendarioGestioneScreen} 
      />
      <Stack.Screen 
        name="OwnerDettaglioPrenotazione" 
        component={DettaglioPrenotazioneOwnerScreen} 
      />
      <Stack.Screen 
        name="InserisciRisultato" 
        component={InserisciRisultatoScreen} 
      />
      <Stack.Screen 
        name="ConfiguraPrezziCampo" 
        component={ConfiguraPrezziCampoScreen} 
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
      />
      <Stack.Screen 
        name="GestisciImmaginiStruttura" 
        component={GestisciImmaginiStruttura} 
      />
      <Stack.Screen 
        name="GroupChat" 
        component={GroupChatScreen} 
      />
      <Stack.Screen 
        name="OwnerCreatePost" 
        component={OwnerCreatePostScreen} 
      />
      <Stack.Screen 
        name="CercaAmiciScreen" 
        component={CercaAmiciScreen} 
      />
      <Stack.Screen 
        name="OwnerCercaAmiciScreen" 
        component={OwnerCercaAmiciScreen} 
      />
      <Stack.Screen 
        name="UserProfile"
        component={UserProfileScreen} 
      />
      <Stack.Screen 
        name="StrutturaDetailScreen"
        component={StrutturaDetailScreen} 
      />
    </Stack.Navigator>
  );
}
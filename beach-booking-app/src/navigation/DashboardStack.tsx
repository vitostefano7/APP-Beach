import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FieldDetailsScreen from "../screens/player/struttura/FieldDetailsScreen/FieldDetailsScreen"
import ConfermaPrenotazioneScreen from "../screens/player/prenotazioni/ConfermaPrenotazioneScreen";
import LeMiePrenotazioniScreen from "../screens/player/prenotazioni/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/player/prenotazioni/DettaglioPrenotazioneScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
import GroupChatScreen from "../screens/player/comunicazioni/GroupChatScreen";
import HomeScreen from "../screens/player/dashboard/DashboardScreen"; // 🆕 Importa HomeScreen
import DettaglioInvito from "../screens/player/dashboard/DettaglioInvitoScreen";
import TuttiInvitiScreen from "../screens/player/dashboard/TuttiInviti";
import InvitoScadutoScreen from "../screens/player/dashboard/InvitoScadutoScreen";
import DettaglioInvitoRifiutato from "../screens/player/dashboard/DettaglioInvitoRifiutatoScreen";
import StruttureScreen from "../screens/player/struttura/StruttureScreen";
import CercaAmiciScreen from "../screens/player/dashboard/CercaAmiciScreen"
import UserProfileScreen from "../screens/player/profilo/UserProfileScreen";
import NotificheScreen from "../screens/player/dashboard/NotificheScreen";
import CercaPartitaScreen from "../screens/player/dashboard/CercaPartitaScreen";
import CommunityScreen from "../screens/player/dashboard/CommunityScreen";
import CreatePostScreen from "../screens/player/dashboard/CreatePostScreen";
import PostDetailScreen from "../screens/player/dashboard/PostDetailScreen";
import StrutturaDetailScreen from "../screens/player/struttura/StrutturaDetailScreen";
import FriendsListScreen from "../screens/player/profilo/FriendsListScreen";
import StrutturaFollowersScreen from "../screens/player/struttura/StrutturaFollowersScreen";

export type DashboardStackParamList = {
  Home: undefined;
  ConfermaPrenotazione: { bookingId: string };
  LeMiePrenotazioni: { initialFilter?: "all" | "upcoming" | "past" } | undefined;
  DettaglioPrenotazione: { bookingId: string };
  Chat: { conversationId: string };
  GroupChat: { matchId: string };
  DettaglioInvito: { matchId: string };
  TuttiInviti: undefined;
  InvitoScaduto: { matchId: string };
  DettaglioInvitoRifiutato: { matchId: string };
  Strutture: undefined;
  FieldDetails: { fieldId: string };
  Campi: { strutturaId: string };
  CercaAmici: undefined;
  ProfiloUtente: {
    userId: string;
  };
  FriendsList: { userId?: string; filter?: "followers" | "following" | "all" } | undefined;
  Notifiche: undefined;
  CercaPartita: undefined;
  Storico: { initialFilter?: "all" | "upcoming" | "past" } | undefined;
  Community: undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };
  StrutturaDetail: { strutturaId: string };
  StrutturaFollowers: { strutturaId: string; strutturaName?: string; type: "followers" | "following" };
};

const Stack = createNativeStackNavigator();

export default function DashboardStack() { // ✅ Nome corretto
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home" // ✅ Nome univoco (non "Dashboard")
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="ConfermaPrenotazione" 
        component={ConfermaPrenotazioneScreen} 
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="LeMiePrenotazioni" 
        component={LeMiePrenotazioniScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GroupChat" 
        component={GroupChatScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DettaglioPrenotazione"
        component={DettaglioPrenotazioneScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FieldDetails"
        component={FieldDetailsScreen}
        options={{
          headerShown: true,
          title: "Dettagli campo",
          headerBackTitle: "Indietro",
        }}
      />
      <Stack.Screen 
        name="DettaglioInvito" 
        component={DettaglioInvito}
        options={{ title: "Dettaglio Invito" }}
      />
      <Stack.Screen 
        name="TuttiInviti" 
        component={TuttiInvitiScreen}
        options={{ title: "Tutti gli Inviti Ricevuti" }}
      />
      <Stack.Screen 
        name="InvitoScaduto" 
        component={InvitoScadutoScreen}
        options={{ title: 'Invito Scaduto' }}
      />
      <Stack.Screen 
        name="DettaglioInvitoRifiutato" 
        component={DettaglioInvitoRifiutato}
        options={{ title: 'Invito Rifiutato' }}
      />
      <Stack.Screen 
        name="Strutture" 
        component={StruttureScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CercaAmici" 
        component={CercaAmiciScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProfiloUtente" 
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FriendsList"
        component={FriendsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Notifiche" 
        component={NotificheScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CercaPartita" 
        component={CercaPartitaScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Storico"
        component={LeMiePrenotazioniScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Community"
        component={CommunityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StrutturaDetail"
        component={StrutturaDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StrutturaFollowers"
        component={StrutturaFollowersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DettaglioStruttura"
        component={FieldDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

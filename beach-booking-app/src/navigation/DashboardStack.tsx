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
    </Stack.Navigator>
  );
}
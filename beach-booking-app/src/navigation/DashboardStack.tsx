import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FieldDetailsScreen from "../screens/player/struttura/FieldDetailsScreen/FieldDetailsScreen"
import ConfermaPrenotazioneScreen from "../screens/player/prenotazioni/ConfermaPrenotazioneScreen";
import LeMiePrenotazioniScreen from "../screens/player/prenotazioni/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/player/prenotazioni/DettaglioPrenotazioneScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
import HomeScreen from "../screens/player/dashboard/DashboardScreen"; // 🆕 Importa HomeScreen
import DettaglioInvito from "../screens/player/dashboard/DettaglioInvitoScreen";

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
    </Stack.Navigator>
  );
}
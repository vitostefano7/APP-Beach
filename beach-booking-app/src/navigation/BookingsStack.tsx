import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeMiePrenotazioniScreen from "../screens/player/prenotazioni/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/player/prenotazioni/DettaglioPrenotazioneScreen";
import InserisciRisultatoScreen from "../screens/InserisciRisultatoScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
import GroupChatScreen from "../screens/player/comunicazioni/GroupChatScreen";
import UserProfileScreen from "../screens/player/profilo/UserProfileScreen";


const Stack = createNativeStackNavigator();

export default function BookingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="LeMiePrenotazioni"
        component={LeMiePrenotazioniScreen}
      />
      <Stack.Screen
        name="DettaglioPrenotazione"
        component={DettaglioPrenotazioneScreen}
      />
      <Stack.Screen
        name="InserisciRisultato"
        component={InserisciRisultatoScreen}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
      />
      <Stack.Screen name="ProfiloUtente" component={UserProfileScreen} />
      
    </Stack.Navigator>
  );
}
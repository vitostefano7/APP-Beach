import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeMiePrenotazioniScreen from "../screens/player/prenotazioni/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/player/prenotazioni/DettaglioPrenotazioneScreen";
import InserisciRisultatoScreen from "../screens/InserisciRisultatoScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
import DettaglioMatchScreen from "../screens/player/prenotazioni/DettaglioMatchScreen";
import GroupChatScreen from "../screens/player/comunicazioni/GroupChatScreen";


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
        name="DettaglioMatch"
        component={DettaglioMatchScreen}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
      />
    </Stack.Navigator>
  );
}
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StruttureScreen from "../screens/player/struttura/StruttureScreen";
import FieldDetailsScreen from "../screens/player/struttura/FieldDetailsScreen/FieldDetailsScreen"
import ConfermaPrenotazioneScreen from "../screens/player/prenotazioni/ConfermaPrenotazioneScreen";
import LeMiePrenotazioniScreen from "../screens/player/prenotazioni/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/player/prenotazioni/DettaglioPrenotazioneScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
import FriendsListScreen from "../screens/player/profilo/FriendsListScreen";
const Stack = createNativeStackNavigator();

export default function StruttureStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Strutture"
        component={StruttureScreen}
        options={{headerShown: false}}

      />
      
      <Stack.Screen name="FriendsList" component={FriendsListScreen} />
      <Stack.Screen 
        name="ConfermaPrenotazione" 
        component={ConfermaPrenotazioneScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="LeMiePrenotazioni" component={LeMiePrenotazioniScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }}/>
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
    </Stack.Navigator>
  );
}
